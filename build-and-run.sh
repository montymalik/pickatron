#!/bin/bash

echo "🚀 Building and running Pickatron Docker container..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Build the Docker image
echo -e "${BLUE}📦 Building Docker image...${NC}"
docker build -t pickatron:latest . || {
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
}

# Stop and remove existing container if it exists
echo -e "${YELLOW}🛑 Stopping existing container (if any)...${NC}"
docker stop pickatron-app 2>/dev/null || true
docker rm pickatron-app 2>/dev/null || true

# Run the container
echo -e "${BLUE}🏃 Starting Pickatron container...${NC}"
docker run -d \
    --name pickatron-app \
    -p 3000:80 \
    --restart unless-stopped \
    pickatron:latest || {
    echo -e "${RED}❌ Failed to start container${NC}"
    exit 1
}

# Wait a moment for the container to start
sleep 2

# Check if container is running
if docker ps | grep -q "pickatron-app"; then
    echo -e "${GREEN}✅ Pickatron is now running!${NC}"
    echo -e "${GREEN}🌐 Open your browser to: http://localhost:3000${NC}"
    echo -e "${BLUE}📊 Container status:${NC}"
    docker ps | grep pickatron-app
    echo ""
    echo -e "${YELLOW}💡 Useful commands:${NC}"
    echo -e "   Stop:    docker stop pickatron-app"
    echo -e "   Restart: docker restart pickatron-app"
    echo -e "   Logs:    docker logs pickatron-app"
    echo -e "   Remove:  docker rm -f pickatron-app"
else
    echo -e "${RED}❌ Container failed to start. Check logs:${NC}"
    docker logs pickatron-app
    exit 1
fi
