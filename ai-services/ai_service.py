import os
import openai
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from pydantic import BaseModel, Field, validator, HttpUrl
from fastapi import FastAPI, HTTPException, Request, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import logging
import time
from functools import lru_cache, wraps
from datetime import datetime, timedelta
import json
import hashlib
import redis
from ratelimit import limits, sleep_and_retry
from tenacity import retry, stop_after_attempt, wait_exponential
import sentry_sdk
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient, ASCENDING, DESCENDING
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="JANMITRA AI Service",
    description="AI-powered features for JANMITRA including danger scoring and auto-descriptions",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables with validation
class Settings(BaseModel):
    OPENAI_API_KEY: str = Field(..., env='OPENAI_API_KEY')
    REDIS_URL: str = Field('redis://localhost:6379/0', env='REDIS_URL')
    RATE_LIMIT: int = Field(60, env='RATE_LIMIT')  # requests per minute
    CACHE_TTL: int = Field(3600, env='CACHE_TTL')  # 1 hour cache
    ENVIRONMENT: str = Field('development', env='ENVIRONMENT')
    SENTRY_DSN: Optional[str] = Field(None, env='SENTRY_DSN')
    
    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

# Initialize settings
settings = Settings()

# Initialize MongoDB client
mongo_client = None
if settings.ENVIRONMENT != 'test':
    try:
        mongo_client = AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
        db = mongo_client.get_database("ai_service")
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        if settings.ENVIRONMENT == 'production':
            raise

# Initialize Sentry for error tracking
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

# Initialize Redis for caching
redis_client = None
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
except Exception as e:
    logger.warning(f"Redis connection failed: {e}. Using in-memory cache.")
    redis_client = None

# Cache decorator with Redis fallback
def cache_response(ttl: int = 3600):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not redis_client:
                return await func(*args, **kwargs)
                
            # Create a cache key from function name and arguments
            cache_key = f"ai_cache:{func.__name__}:{hashlib.md5(str(args[1:]).encode()).hexdigest()}"
            
            # Try to get cached result
            cached_result = redis_client.get(cache_key)
            if cached_result:
                logger.debug(f"Cache hit for {cache_key}")
                return json.loads(cached_result)
                
            # Call the function and cache the result
            result = await func(*args, **kwargs)
            if result is not None:
                redis_client.setex(cache_key, ttl, json.dumps(jsonable_encoder(result)))
            return result
            
        return wrapper
    return decorator

# Rate limiting decorator
RATE_LIMIT = settings.RATE_LIMIT
ONE_MINUTE = 60

@sleep_and_retry
@limits(calls=RATE_LIMIT, period=ONE_MINUTE)
def check_rate_limit():
    """Raises an exception if the rate limit is exceeded"""
    return True

# Initialize OpenAI client with retry mechanism
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    reraise=True
)
async def get_openai_client():
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY is not configured")
    
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)
        # Test the connection
        client.models.list()
        logger.info("Successfully connected to OpenAI API")
        return client
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")
        raise

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    try:
        app.state.openai_client = await get_openai_client()
        # Initialize metrics
        Instrumentator().instrument(app).expose(app)
    except Exception as e:
        logger.error(f"Startup error: {e}")
        if settings.ENVIRONMENT != 'development':
            raise

# Models
class LocationData(BaseModel):
    """Location data model with validation."""
    lat: float = Field(..., ge=-90, le=90, description="Latitude between -90 and 90")
    lng: float = Field(..., ge=-180, le=180, description="Longitude between -180 and 180")
    address: Optional[str] = None
    accuracy: Optional[float] = Field(None, ge=0, description="Accuracy in meters")
    
    @validator('lat', 'lng')
    def validate_coordinates(cls, v, field):
        if field.name == 'lat' and not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90')
        if field.name == 'lng' and not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180')
        return v

class ComplaintData(BaseModel):
    """Enhanced complaint data structure with validation."""
    description: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(..., min_length=2, max_length=100)
    location: LocationData
    media_type: Optional[str] = Field(
        None, 
        regex='^(image|video|audio|document|none)$',
        description="Type of media attached to the complaint"
    )
    media_count: int = Field(0, ge=0, le=10, description="Number of media files (0-10)")
    upvotes: int = Field(0, ge=0, description="Number of upvotes")
    user_history: Optional[Dict[str, Any]] = Field(
        None,
        description="User's previous complaint history"
    )
    additional_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Additional context or metadata"
    )
    language: str = Field("en", min_length=2, max_length=2, description="ISO 639-1 language code")
    
    class Config:
        schema_extra = {
            "example": {
                "description": "There's a large pothole causing traffic issues",
                "category": "Roads",
                "location": {
                    "lat": 12.9716,
                    "lng": 77.5946,
                    "address": "MG Road, Bangalore"
                },
                "media_type": "image",
                "media_count": 1,
                "language": "en"
            }
        }

class DangerScoreResponse(BaseModel):
    """Response model for danger score calculation."""
    score: float  # 0-10 scale for compatibility with backend
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    factors: List[str] = []  # List of factors contributing to the score
    confidence: float = 0.8  # Confidence score (0-1)

class AutoDescriptionResponse(BaseModel):
    """Response model for auto-generated descriptions."""
    description: str
    keywords: List[str]
    confidence: float

class FeedbackRequest(BaseModel):
    """Model for user feedback on AI analysis."""
    complaint_id: str
    feedback_type: str  # 'positive', 'negative', 'correction'
    message: Optional[str] = None
    corrections: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None  # 0-1

# Constants
RISK_LEVELS = {
    'low': (0, 3.3),
    'medium': (3.4, 6.6),
    'high': (6.7, 8.3),
    'critical': (8.4, 10.0)
}

# High-risk keywords that would increase danger score
HIGH_RISK_KEYWORDS = [
    'fire', 'emergency', 'accident', 'injury', 'blood', 'violence',
    'attack', 'fight', 'explosion', 'leak', 'gas', 'chemical', 'collapse',
    'flood', 'electrocution', 'hazard', 'danger', 'urgent', 'help',
    'blocked', 'obstruction', 'sinkhole', 'damage', 'broken', 'outage',
    'exposed', 'unsafe', 'threat', 'crack', 'leaking'
]

# Risk scores for different categories (0-10 scale)
CATEGORY_RISK_SCORES = {
    'accident': 8.0,
    'fire': 9.5,
    'flood': 8.5,
    'violence': 9.0,
    'medical': 8.0,
    'electrical': 7.5,
    'water': 6.0,
    'road': 5.5,
    'sanitation': 4.5,
    'garbage': 4.0,
    'street_light': 3.5,
    'other': 3.0
}

# Utility functions
def get_risk_level(score: float) -> str:
    """Convert a score to a risk level."""
    for level, (min_score, max_score) in RISK_LEVELS.items():
        if min_score <= score <= max_score:
            return level
    return 'low'

def contains_high_risk_keywords(text: str) -> Tuple[bool, List[str]]:
    """Check if text contains high-risk keywords."""
    if not text:
        return False, []
    
    text_lower = text.lower()
    found_keywords = [kw for kw in HIGH_RISK_KEYWORDS if kw in text_lower]
    return len(found_keywords) > 0, found_keywords

# AI Functions
async def generate_danger_score(complaint: ComplaintData) -> DangerScoreResponse:
    """
    Generate a danger score for a complaint using a combination of rule-based and AI analysis.
    
    Args:
        complaint: The complaint data including description, category, etc.
        
    Returns:
        DangerScoreResponse with score, risk level, and factors
    """
    try:
        # Base score from category
        base_score = CATEGORY_RISK_SCORES.get(complaint.category.lower(), 30)
        
        # Check for high-risk keywords
        has_high_risk, found_keywords = contains_high_risk_keywords(complaint.description)
        
        # Adjust score based on high-risk keywords
        keyword_adjustment = 0
        if has_high_risk:
            keyword_adjustment = 20
            if len(found_keywords) > 2:  # Multiple high-risk keywords
                keyword_adjustment = 30
        
        # Adjust based on media type
        media_adjustment = 0
        if complaint.media_type == 'video':
            media_adjustment = 10
        elif complaint.media_type == 'image':
            media_adjustment = 5
        
        # Calculate final score (clamped between 0-100)
        final_score = min(100, max(0, base_score + keyword_adjustment + media_adjustment))
        
        # Generate factors
        factors = []
        if has_high_risk:
            factors.append(f"High-risk keywords detected: {', '.join(found_keywords)}")
        if complaint.media_type:
            factors.append(f"Includes {complaint.media_type} media")
        
        # Add AI analysis if available
        if OPENAI_API_KEY:
            try:
                response = await openai.ChatCompletion.acreate(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a risk assessment AI. Analyze the following complaint and provide a brief risk assessment. Focus on potential danger to public safety, health hazards, and urgency."},
                        {"role": "user", "content": f"Complaint: {complaint.description}\n\nCategory: {complaint.category}"}
                    ],
                    max_tokens=100,
                    temperature=0.3
                )
                ai_analysis = response.choices[0].message.content
                factors.append(f"AI analysis: {ai_analysis}")
            except Exception as e:
                logger.error(f"Error calling OpenAI: {str(e)}")
        
        return DangerScoreResponse(
            score=final_score,
            risk_level=get_risk_level(final_score),
            factors=factors,
            confidence=0.8
        )
    except Exception as e:
        logger.error(f"Error in generate_danger_score: {str(e)}")
        # Return a default medium risk score in case of errors
        return DangerScoreResponse(
            score=5.0,
            risk_level='medium',
            factors=[f"Error in analysis: {str(e)}"],
            confidence=0.0
        )

async def generate_auto_description(complaint: ComplaintData) -> AutoDescriptionResponse:
    """
    Generate a concise, informative description from the complaint data.
    
    Args:
        complaint: The complaint data
        
    Returns:
        AutoDescriptionResponse with generated description and keywords
    """
    try:
        # If we have an API key, use GPT for better descriptions
        if OPENAI_API_KEY:
            try:
                response = await openai.ChatCompletion.acreate(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that generates concise, informative descriptions for citizen complaints. Create a 7-10 word description that captures the key issue. Also extract 3-5 keywords."},
                        {"role": "user", "content": f"Complaint: {complaint.description}\n\nCategory: {complaint.category}"}
                    ],
                    temperature=0.3,
                    max_tokens=50
                )
                content = response.choices[0].message.content
                
                # Parse the response to separate description and keywords
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                description = lines[0]
                
                # Look for keywords line (might start with Keywords: or similar)
                keywords = []
                for line in lines[1:]:
                    if ':' in line:
                        key, value = line.split(':', 1)
                        if 'keyword' in key.lower():
                            keywords = [k.strip().strip('"\'') for k in value.split(',')]
                            keywords = [k for k in keywords if k][:5]  # Limit to 5 keywords
                            break
                
                # If no keywords found, generate some from the description
                if not keywords:
                    keywords = list(set(complaint.description.lower().split()))
                    keywords = [k for k in keywords if len(k) > 3][:5]
                
                return AutoDescriptionResponse(
                    description=description,
                    keywords=keywords,
                    confidence=0.9
                )
            except Exception as e:
                logger.error(f"Error calling OpenAI for description: {str(e)}")
        
        # Fallback to simple rule-based description
        category = complaint.category.replace('_', ' ').title()
        has_urgent = any(word in complaint.description.lower() for word in ['urgent', 'emergency', 'immediate', 'help'])
        
        if has_urgent:
            description = f"Urgent: {category} issue requires immediate attention"
        else:
            description = f"{category} issue reported"
        
        # Generate simple keywords
        words = [w.lower() for w in complaint.description.split() if len(w) > 3]
        word_freq = {}
        for word in words:
            word_freq[word] = word_freq.get(word, 0) + 1
        
        # Get top 5 most common words as keywords
        keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]
        keywords = [k[0] for k in keywords]
        
        return AutoDescriptionResponse(
            description=description,
            keywords=keywords,
            confidence=0.6
        )
    except Exception as e:
        logger.error(f"Error in generate_auto_description: {str(e)}")
        return AutoDescriptionResponse(
            description=f"{complaint.category} issue reported",
            keywords=complaint.category.lower().split(),
            confidence=0.0
        )

# API Endpoints
@app.post("/api/ai/danger-score", response_model=DangerScoreResponse)
@cache_response(ttl=3600)  # Cache for 1 hour
async def get_danger_score(
    request: Request,
    complaint: ComplaintData,
    background_tasks: BackgroundTasks
) -> DangerScoreResponse:
    """
    Calculate a danger score for a complaint with rate limiting and caching.
    """
    try:
        # Check rate limit
        check_rate_limit()
        
        # Generate a cache key
        cache_key = f"danger_score:{hashlib.md5(json.dumps(complaint.dict()).encode()).hexdigest()}"
        
        # Log the request for monitoring
        logger.info(f"Danger score request: {complaint.category} in {complaint.location}")
        
        # Process in background if it's a heavy operation
        if len(complaint.description) > 1000:  # Large text processing
            background_tasks.add_task(
                log_ai_usage,
                feature="danger_score",
                input_data=complaint.dict(),
                user_agent=request.headers.get('user-agent')
            )
        
        # Generate the score
        result = await generate_danger_score(complaint)
        
        # Update cache asynchronously
        if redis_client:
            background_tasks.add_task(
                redis_client.setex,
                cache_key,
                settings.CACHE_TTL,
                json.dumps(jsonable_encoder(result))
            )
            
        return result
        
    except Exception as e:
        logger.error(f"Error in get_danger_score: {e}", exc_info=True)
        if settings.SENTRY_DSN:
            sentry_sdk.capture_exception(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate danger score: {str(e)}"
        )

@app.post("/api/ai/auto-description", response_model=AutoDescriptionResponse)
async def get_auto_description(complaint: ComplaintData):
    """
    Generate an automatic description for a complaint.
    """
    try:
        return await generate_auto_description(complaint)
    except Exception as e:
        logger.error(f"Error in /api/ai/auto-description: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "janmitra-ai"}

# Background task for logging
async def log_ai_usage(
    feature: str,
    input_data: Dict[str, Any],
    user_agent: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
):
    """Log AI feature usage asynchronously."""
    try:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "feature": feature,
            "input_hash": hashlib.md5(json.dumps(input_data).encode()).hexdigest(),
            "user_agent": user_agent,
            "metadata": metadata or {}
        }
        
        if redis_client:
            # Store in Redis with 30-day expiry
            log_key = f"ai_usage:{feature}:{log_entry['timestamp']}"
            redis_client.setex(log_key, 60*60*24*30, json.dumps(log_entry))
            
    except Exception as e:
        logger.error(f"Error logging AI usage: {e}")
        if settings.SENTRY_DSN:
            sentry_sdk.capture_exception(e)

# Health check endpoint with dependency injection
@app.get("/health")
async def health_check():
    """Health check endpoint with dependency verification."""
    checks = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "openai": "ok" if hasattr(app.state, 'openai_client') and app.state.openai_client else "unavailable",
            "redis": "ok" if redis_client and redis_client.ping() else "unavailable",
            "sentry": "enabled" if settings.SENTRY_DSN else "disabled"
        },
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }
    
    return checks

# Initialize Prometheus metrics
REQUESTS = Counter('ai_requests_total', 'Total AI API requests', ['endpoint', 'status'])
REQUEST_TIME = Histogram('ai_request_duration_seconds', 'Time spent processing requests', ['endpoint'])
ERRORS = Counter('ai_errors_total', 'Total errors', ['error_type'])

# Add metrics endpoint
@app.get("/metrics")
async def metrics():
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

# Add request monitoring middleware
@app.middleware("http")
async def monitor_requests(request: Request, call_next):
    start_time = time.time()
    endpoint = request.url.path
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Record metrics
        REQUESTS.labels(endpoint=endpoint, status=response.status_code).inc()
        REQUEST_TIME.labels(endpoint=endpoint).observe(process_time)
        
        return response
        
    except HTTPException as e:
        ERRORS.labels(error_type=f"http_{e.status_code}").inc()
        raise
    except Exception as e:
        ERRORS.labels(error_type=type(e).__name__).inc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

# Initialize Prometheus instrumentation
Instrumentator().instrument(app).expose(app)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "ai_service:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        workers=4 if settings.ENVIRONMENT == "production" else 1,
        log_level="info"
    )
