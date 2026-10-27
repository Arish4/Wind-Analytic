# Stage 1: build the React app
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Stage 2: Django API that also serves the built frontend
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_DEBUG=false \
    FRONTEND_DIST=/app/frontend_dist \
    CACHE_DIR=/tmp/windcast-cache

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend /app/frontend/dist ./frontend_dist

RUN useradd --create-home appuser
USER appuser

EXPOSE 8000
# Heroku injects $PORT; locally we fall back to 8000.
CMD gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120
