#!/bin/bash
# Deploy PartyApp to production server
# Usage: ./deploy.sh yourdomain.com

DOMAIN=${1:-localhost}
SECRET=$(openssl rand -hex 32)

echo "🚀 Deploying PartyApp..."
echo "Domain: $DOMAIN"

# Create .env.prod
cat > .env.prod << EOF
DB_PASSWORD=partyapp_prod_$(openssl rand -hex 8)
NEXTAUTH_SECRET=$SECRET
NEXTAUTH_URL=https://$DOMAIN
WEBHOOK_API_KEY=siyasat-$(openssl rand -hex 8)
EOF

echo "📦 Building Docker images..."
docker compose -f docker-compose.prod.yml --env-file .env.prod build

echo "🗄️ Starting database..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d db
sleep 5

echo "🚀 Starting app..."
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d app
sleep 5

echo "🔄 Running database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.prod exec app npx prisma db push --accept-data-loss

echo ""
echo "✅ PartyApp deployed!"
echo "🔗 http://$DOMAIN:3000"
echo "📋 Credentials in .env.prod"
echo ""
echo "Next: Set up reverse proxy (nginx/caddy) for HTTPS on port 443"
