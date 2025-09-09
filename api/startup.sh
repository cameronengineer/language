#!/bin/bash

# Startup script for Language Learning API with automatic data loading
# This script:
# 1. Starts the FastAPI server in the background
# 2. Waits for the API to be ready
# 3. Optionally loads initial data if LOAD_INITIAL_DATA=true
# 4. Keeps the API running in the foreground

set -e

# Environment variables with defaults
LOAD_INITIAL_DATA=${LOAD_INITIAL_DATA:-false}
DATA_LOAD_DELAY=${DATA_LOAD_DELAY:-10}
API_BASE_URL=${API_BASE_URL:-http://localhost:8000}

echo "🚀 Starting Language Learning API..."
echo "📋 Configuration:"
echo "   - Load Initial Data: $LOAD_INITIAL_DATA"
echo "   - Data Load Delay: $DATA_LOAD_DELAY seconds"
echo "   - API Base URL: $API_BASE_URL"

# Function to check if API is ready
check_api_ready() {
    python -c "
import httpx
import sys
try:
    response = httpx.get('$API_BASE_URL/health', timeout=5)
    sys.exit(0 if response.status_code == 200 else 1)
except Exception:
    sys.exit(1)
" > /dev/null 2>&1
}

# Function to wait for API to be ready
wait_for_api() {
    echo "⏳ Waiting for API to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if check_api_ready; then
            echo "✅ API is ready!"
            return 0
        fi
        
        echo "🔄 Attempt $attempt/$max_attempts - API not ready yet, waiting 2 seconds..."
        sleep 2
        ((attempt++))
    done
    
    echo "❌ API failed to become ready after $max_attempts attempts"
    return 1
}

# Function to load initial data
load_initial_data() {
    echo "📚 Loading initial data..."
    
    # Additional delay before data loading
    if [ "$DATA_LOAD_DELAY" -gt 0 ]; then
        echo "⏰ Waiting additional $DATA_LOAD_DELAY seconds before data loading..."
        sleep "$DATA_LOAD_DELAY"
    fi
    
    # Run the data generator
    echo "🔄 Running data generator..."
    if python data_generator.py; then
        echo "✅ Initial data loaded successfully!"
    else
        echo "⚠️ Warning: Data loading failed, but continuing with API service"
        echo "   This might be normal if data already exists"
    fi
}

# Function to cleanup background processes
cleanup() {
    echo "🔄 Shutting down..."
    if [ ! -z "$API_PID" ]; then
        kill "$API_PID" 2>/dev/null || true
        wait "$API_PID" 2>/dev/null || true
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Start the FastAPI server in the background
echo "🌐 Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 &
API_PID=$!

# Wait for API to be ready
if wait_for_api; then
    # Load initial data if requested
    if [ "$LOAD_INITIAL_DATA" = "true" ]; then
        load_initial_data
    else
        echo "ℹ️ Skipping initial data loading (LOAD_INITIAL_DATA=false)"
    fi
    
    echo "🎉 Language Learning API is running and ready!"
    echo "📊 API available at: $API_BASE_URL"
    echo "📖 Documentation: $API_BASE_URL/docs"
    
    # Wait for the API process to finish (keeps container running)
    wait "$API_PID"
else
    echo "❌ Failed to start API service"
    cleanup
    exit 1
fi