# 🐳 Docker Deployment Guide for AmSpec-App v2

This guide provides comprehensive instructions for deploying AmSpec-App v2 using Docker and Docker Compose.

---

## 📋 Prerequisites

Before you begin, ensure you have:

- ✅ Docker 20.10+ installed
- ✅ Docker Compose 2.0+ installed
- ✅ At least 4GB RAM available
- ✅ At least 10GB disk space available

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/cuellar1992/AmSpec-App.git
cd AmSpec-App
```

### 2. Configure Environment Variables

```bash
# Copy the Docker environment file
cp .docker.env .env.local

# Generate secure JWT secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Update .env.local with the generated secrets
```

### 3. Start the Application

```bash
# Production deployment
docker-compose up -d

# Development deployment (with hot reload)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/health

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Network                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Nginx Proxy   │  │   AmSpec App    │  │   MongoDB    │ │
│  │   (Optional)    │  │  (Front+Back)   │  │   Database   │ │
│  │   Port: 80/443  │  │   Port: 8080    │  │  Port: 27017 │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **AmSpec App Container**
   - Multi-stage build with Node.js 18 Alpine
   - Frontend built with Vite
   - Backend with Express.js
   - Serves static files from `/public`
   - Health check endpoint at `/health`

2. **MongoDB Container**
   - MongoDB 7.0 Community Edition
   - Persistent data volume
   - Automatic initialization script
   - User authentication enabled

3. **Nginx Proxy** (Optional)
   - Reverse proxy for production
   - SSL termination
   - Static file serving optimization

---

## 📁 File Structure

```
AmSpec-App/
├── Dockerfile                    # Multi-stage build configuration
├── docker-compose.yml            # Production deployment
├── docker-compose.override.yml   # Development overrides
├── .docker.env                  # Environment variables template
├── .dockerignore               # Docker build exclusions
├── docker/
│   ├── mongodb/
│   │   └── init-mongo.js       # Database initialization
│   └── nginx/
│       └── nginx.conf          # Nginx configuration
├── server/
│   ├── server.js               # Backend application
│   └── ...                    # Backend source code
├── src/                       # Frontend source code
└── ...                        # Other project files
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `production` | Yes |
| `PORT` | Application port | `8080` | Yes |
| `MONGODB_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_REFRESH_SECRET` | JWT refresh secret | - | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | - | Yes |

### Volumes

| Volume | Purpose | Path |
|--------|---------|------|
| `mongodb_data` | MongoDB data persistence | `/data/db` |
| `app_uploads` | File uploads | `/app/server/uploads` |

---

## 🔄 Development Workflow

### 1. Development Mode

```bash
# Start with hot reload
docker-compose -f docker-compose.yml -f docker-compose.override.yml up

# View logs
docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f app

# Stop services
docker-compose -f docker-compose.yml -f docker-compose.override.yml down
```

### 2. Production Mode

```bash
# Build and start production containers
docker-compose up -d --build

# View logs
docker-compose logs -f app

# Scale the application
docker-compose up -d --scale app=2

# Stop services
docker-compose down
```

---

## 🛠️ Maintenance

### 1. Updates

```bash
# Pull latest images
docker-compose pull

# Rebuild with latest code
docker-compose up -d --build

# Clean up unused images
docker image prune -f
```

### 2. Backups

```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --out /data/backup

# Restore MongoDB
docker-compose exec mongodb mongorestore /data/backup
```

### 3. Monitoring

```bash
# Check container status
docker-compose ps

# Check resource usage
docker stats

# View health status
curl http://localhost:8080/health
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose exec app env | grep -E "(MONGODB|JWT|FRONTEND)"

# Verify MongoDB connection
docker-compose exec app node -e "console.log(process.env.MONGODB_URI)"
```

#### 2. MongoDB Connection Issues

```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ismaster')"

# Verify user creation
docker-compose exec mongodb mongosh amspec -u amspec_user -p amspec123 --eval "db.runCommand('connectionStatus')"
```

#### 3. Port Conflicts

```bash
# Check port usage
netstat -tulpn | grep :8080

# Change ports in docker-compose.yml
ports:
  - "8081:8080"  # Use 8081 instead of 8080
```

#### 4. Build Issues

```bash
# Clean build cache
docker builder prune -f

# Rebuild from scratch
docker-compose build --no-cache
```

---

## 🔒 Security Considerations

### 1. Production Security

- ✅ Use non-root user in containers
- ✅ Enable MongoDB authentication
- ✅ Use environment-specific secrets
- ✅ Implement rate limiting
- ✅ Enable HTTPS in production

### 2. Network Security

```bash
# Create isolated network
docker network create --driver bridge amspec-network

# Use custom network in docker-compose.yml
networks:
  amspec-network:
    external: true
```

### 3. Secrets Management

```bash
# Use Docker secrets (recommended for production)
echo "your-jwt-secret" | docker secret create jwt_secret -

# Reference in docker-compose.yml
secrets:
  jwt_secret:
    external: true
```

---

## 📊 Performance Optimization

### 1. Resource Limits

```yaml
# Add to docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 2. Caching

```yaml
# Add Redis for session caching
redis:
  image: redis:7-alpine
  volumes:
    - redis_data:/data
```

### 3. Load Balancing

```yaml
# Scale with multiple instances
services:
  app:
    deploy:
      replicas: 3
```

---

## 🚀 Production Deployment

### 1. Server Requirements

- **CPU**: 2+ cores
- **RAM**: 4GB+ recommended
- **Storage**: 20GB+ SSD
- **OS**: Ubuntu 20.04+ or Docker-compatible

### 2. Production Setup

```bash
# 1. Set up production environment
cp .docker.env .env.production

# 2. Generate production secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))" >> .env.production

# 3. Deploy with production profile
docker-compose --profile production up -d

# 4. Set up SSL certificates
certbot certonly --webroot -w /var/www/html -d yourdomain.com

# 5. Configure nginx for SSL
# Edit docker/nginx/nginx.conf
```

### 3. Monitoring Setup

```bash
# Add monitoring stack
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Access monitoring dashboards
# Grafana: http://localhost:3000
# Prometheus: http://localhost:9090
```

---

## 📝 Scripts

### 1. Deployment Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying AmSpec-App..."

# Pull latest code
git pull origin main

# Build and start containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for health check
echo "⏳ Waiting for application to be healthy..."
sleep 30

# Verify deployment
if curl -f http://localhost:8080/health; then
    echo "✅ Deployment successful!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
```

### 2. Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/amspec"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec -T mongodb mongodump --archive | gzip > $BACKUP_DIR/mongodb_$DATE.gz

# Backup uploads
docker run --rm -v amspec_app_uploads:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/uploads_$DATE.tar.gz -C /data .

echo "✅ Backup completed: $BACKUP_DIR"
```

---

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify configuration: `docker-compose config`
3. Check health status: `curl http://localhost:8080/health`
4. Review this documentation
5. Check the main project README

---

## 📄 License

This deployment configuration is part of the AmSpec-App v2 project. Please refer to the main project license for usage terms.