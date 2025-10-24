#!/bin/bash
# Server update script
# Usage: ./update-server.sh

echo "🚀 Updating RailGuard..."

cd /opt/railguard

# Pull latest image
echo "📥 Pulling latest image..."
docker compose -f docker-compose.prod.yml pull

# Restart containers
echo "🔄 Restarting containers..."
docker compose -f docker-compose.prod.yml up -d

# Show status
echo "📊 Status:"
docker compose -f docker-compose.prod.yml ps

echo "✅ Update complete!"
echo "🌐 Check: https://railguard.ru"
