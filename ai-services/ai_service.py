import os
import openai
import numpy as np
from typing import Dict, List, Tuple, Optional
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging

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

# Load environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logger.warning("OPENAI_API_KEY not found in environment variables")

# Initialize OpenAI client
openai.api_key = OPENAI_API_KEY

# Models
class ComplaintData(BaseModel):
    description: str
    category: str
    location: Dict[str, float]  # {latitude, longitude}
    media_type: Optional[str] = None  # 'image' or 'video' or None
    user_history: Optional[Dict] = None  # User's complaint history
    additional_context: Optional[Dict] = None

class DangerScoreResponse(BaseModel):
    score: float  # 0-100
    risk_level: str  # 'low', 'medium', 'high', 'critical'
    factors: List[str]  # List of factors contributing to the score
    confidence: float  # 0-1

class AutoDescriptionResponse(BaseModel):
    description: str
    keywords: List[str]
    confidence: float  # 0-1

# Constants
RISK_LEVELS = {
    'low': (0, 30),
    'medium': (31, 70),
    'high': (71, 90),
    'critical': (91, 100)
}

# Predefined categories with base risk scores
CATEGORY_RISK_SCORES = {
    'medical_emergency': 95,
    'fire': 90,
    'violence': 85,
    'accident': 80,
    'electrical_hazard': 75,
    'water_leakage': 60,
    'road_damage': 55,
    'garbage': 40,
    'street_light': 35,
    'other': 30
}

# Keywords that indicate higher risk
HIGH_RISK_KEYWORDS = [
    'fire', 'emergency', 'accident', 'injury', 'blood', 'violence',
    'attack', 'fight', 'explosion', 'leak', 'gas', 'chemical', 'collapse',
    'flood', 'electrocution', 'hazard', 'danger', 'urgent', 'help'
]

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
                factors.append("AI analysis unavailable")
        
        return DangerScoreResponse(
            score=round(final_score, 1),
            risk_level=get_risk_level(final_score),
            factors=factors,
            confidence=0.85  # Confidence in the score
        )
    except Exception as e:
        logger.error(f"Error in generate_danger_score: {str(e)}")
        # Return a default medium risk score in case of errors
        return DangerScoreResponse(
            score=50.0,
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
async def get_danger_score(complaint: ComplaintData):
    """
    Calculate a danger score for a complaint.
    """
    try:
        return await generate_danger_score(complaint)
    except Exception as e:
        logger.error(f"Error in /api/ai/danger-score: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
