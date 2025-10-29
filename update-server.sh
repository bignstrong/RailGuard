#!/bin/bash
# Server update script
# Usage: ./update-server.sh

echo "🚀 Updating RailGuard..."

cd /opt/railguard

# Pull latest images
echo "📥 Pulling latest images..."
docker compose -f docker-compose.prod.yml pull web

# Rebuild bot
echo "🤖 Building bot..."
docker compose -f docker-compose.prod.yml build bot

# Restart all containers
echo "🔄 Restarting containers..."
docker compose -f docker-compose.prod.yml up -d

# Show status
echo "📊 Status:"
docker compose -f docker-compose.prod.yml ps

echo "✅ Update complete!"
echo "🌐 Check: https://railguard.ru"
