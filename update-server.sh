#!/bin/bash
# Server update script
# Usage: ./update-server.sh

echo "🚀 Updating RailGuard..."

cd /opt/railguard

# Pull code
echo "📥 Pulling code..."
git pull --ff-only

# Build image
echo "🔨 Building web..."
docker compose -f docker-compose.prod.yml build web

# Restart containers
echo "🔄 Restarting containers..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Show status
echo "📊 Status:"
docker compose -f docker-compose.prod.yml ps

echo "✅ Update complete!"
echo "🌐 Check: https://railguard.ru"
