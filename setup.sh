#!/bin/bash

echo "InterviewOS - Project Setup"
echo "=============================="
echo ""

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "[WARNING] Docker Compose not found. Please install Docker and Docker Compose."
    echo "   Download: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "[OK] Docker Compose found"

# Setup environment files
echo ""
echo "Setting up environment files..."

if [ ! -f backend/.env ]; then
    cp backend/.env backend/.env.backup 2>/dev/null || true
    echo "DATABASE_URL=postgres://interviewos:interviewos_dev@postgres:5432/interviewos
REDIS_URL=redis://redis:6379
JWT_SECRET=dev-secret-key-change-in-production
OPENAI_API_KEY=your-api-key
PORT=8080
ENV=development" > backend/.env
    echo "[OK] Created backend/.env"
else
    echo "[OK] backend/.env already exists"
fi

if [ ! -f frontend/.env.local ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080" > frontend/.env.local
    echo "[OK] Created frontend/.env.local"
else
    echo "[OK] frontend/.env.local already exists"
fi

echo ""
echo "Starting InterviewOS with Docker Compose..."
echo ""
echo "Services starting:"
echo "  • PostgreSQL (localhost:5432)"
echo "  • Redis (localhost:6379)"
echo "  • Backend API (http://localhost:8080)"
echo "  • Frontend (http://localhost:3000)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

docker-compose up

echo ""
echo "Services stopped."
