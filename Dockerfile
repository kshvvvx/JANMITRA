# JANMITRA Multi-stage Dockerfile
# Builds both backend and AI services

# Stage 1: Backend
FROM node:18-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ ./
EXPOSE 5000
CMD ["npm", "start"]

# Stage 2: AI Services
FROM python:3.9-slim AS ai-services
WORKDIR /app/ai-services
COPY ai-services/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY ai-services/ ./
EXPOSE 5001
CMD ["python", "app.py"]

# Stage 3: Production (combines both)
FROM node:18-alpine AS production
WORKDIR /app

# Install Python for AI services
RUN apk add --no-cache python3 py3-pip

# Copy backend
COPY --from=backend /app/backend ./backend
WORKDIR /app/backend
RUN npm ci --only=production

# Copy AI services
COPY --from=ai-services /app/ai-services ../ai-services
WORKDIR /app/ai-services
RUN pip install --no-cache-dir -r requirements.txt

# Create startup script
WORKDIR /app
COPY docker-start.sh ./
RUN chmod +x docker-start.sh

EXPOSE 5000 5001
CMD ["./docker-start.sh"]
