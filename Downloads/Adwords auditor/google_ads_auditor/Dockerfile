FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create reports directory
RUN mkdir -p /app/reports

# Expose port for Cloud Run
EXPOSE 8080

# Run the Flask server (Cloud Run uses HTTP triggers)
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--timeout", "300", "cloud_server:app"]
