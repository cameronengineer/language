FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy startup script and make it executable
COPY startup.sh /app/startup.sh

# Create a non-root user to run the application
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app \
    && chmod -R 755 /app \
    && chmod +x /app/startup.sh
USER appuser

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application using startup script
CMD ["bash", "/app/startup.sh"]