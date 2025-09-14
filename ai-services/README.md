# JANMITRA AI Service

This service provides AI-powered features for the JANMITRA application, including danger scoring and automatic description generation for complaints.

## Features

- **Danger Scoring**: Analyzes complaints and assigns a risk score based on content, category, and context.
- **Auto-Description**: Generates concise, informative descriptions from complaint details.
- **Category Classification**: Automatically categorizes complaints for better organization.
- **Sentiment Analysis**: Detects urgency and emotional tone in complaint text.

## API Endpoints

### Danger Score

- **POST** `/api/ai/danger-score`
  - Request body: `ComplaintData`
  - Response: `DangerScoreResponse`

### Auto Description

- **POST** `/api/ai/auto-description`
  - Request body: `ComplaintData`
  - Response: `AutoDescriptionResponse`

### Health Check

- **GET** `/health`
  - Response: `{ "status": "ok", "service": "janmitra-ai" }`

## Data Models

### ComplaintData

```typescript
{
  description: string;          // The complaint text
  category: string;            // Complaint category (e.g., 'water', 'electricity')
  location: {                  // Location data
    latitude: number;
    longitude: number;
  };
  media_type?: 'image' | 'video' | null;  // Type of media attached
  user_history?: {             // Optional user complaint history
    previous_complaints: number;
    avg_resolution_time?: number;
  };
  additional_context?: any;     // Any additional context
}
```

### DangerScoreResponse

```typescript
{
  score: number;               // 0-100 risk score
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];           // Factors contributing to the score
  confidence: number;          // 0-1 confidence in the score
}
```

### AutoDescriptionResponse

```typescript
{
  description: string;         // Generated description (7-10 words)
  keywords: string[];         // Extracted keywords
  confidence: number;         // 0-1 confidence in the description
}
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Run the service:
   ```bash
   uvicorn ai_service:app --reload
   ```

## Docker

Build the Docker image:
```bash
docker build -t janmitra-ai .
```

Run the container:
```bash
docker run -d -p 8000:8000 --env-file .env janmitra-ai
```

## Configuration

See `.env.example` for all available configuration options.

## Development

- Format code with `black` and `isort`
- Run tests with `pytest`
- Use type hints and docstrings for all functions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
