#!/bin/bash
# Script to fix PostgreSQL password authentication

echo "🔧 Fixing PostgreSQL password issue..."

# Stop the containers
docker-compose down

# Remove the old database volume (this will delete all data)
echo "⚠️  WARNING: This will delete all existing data"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    docker volume rm zero-health_postgres_data 2>/dev/null || true

    # Start fresh
    docker-compose up -d db

    echo "⏳ Waiting for database to initialize..."
    sleep 10

    echo "✅ Database reset complete!"
    echo "🚀 Starting all services..."
    docker-compose up -d

    echo "📊 Checking status..."
    docker-compose ps
fi
