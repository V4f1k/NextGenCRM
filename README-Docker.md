# NextGenCRM Docker Setup

This document provides comprehensive instructions for running NextGenCRM using Docker in both development and production environments.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

## Quick Start

### Development Environment

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd NextGenCRM
   cp .env.example .env
   ```

2. **Start development environment:**
   ```bash
   ./scripts/docker-dev.sh start
   ```

3. **Run initial setup:**
   ```bash
   ./scripts/docker-dev.sh migrate
   ./scripts/docker-dev.sh superuser
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/v1/
   - Django Admin: http://localhost:8000/admin/

### Production Environment

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

2. **Deploy:**
   ```bash
   ./scripts/docker-prod.sh deploy
   ```

3. **Access the application:**
   - Application: http://localhost/ (or your domain)
   - API: http://localhost/api/v1/

## Architecture

### Services

**Development Environment:**
- `postgres` - PostgreSQL 15 database
- `redis` - Redis cache and message broker
- `backend` - Django development server
- `frontend` - Vite development server

**Production Environment:**
- `postgres` - PostgreSQL 15 database
- `redis` - Redis with password protection
- `backend` - Django with Gunicorn
- `frontend` - React app served by Nginx
- `celery-worker` - Background task processing
- `celery-beat` - Scheduled task management

### Networking

All services communicate through the `nextgencrm-network` Docker network. In production, only the frontend (Nginx) exposes external ports.

### Data Persistence

- `postgres_data` - Database files
- `redis_data` - Redis persistence
- `backend_static` - Django static files
- `backend_media` - User uploaded files (production only)

## Environment Configuration

### Required Variables

```bash
# Security
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key

# Database
POSTGRES_PASSWORD=secure-password
DATABASE_URL=postgresql://postgres:password@postgres:5432/nextgencrm

# Redis
REDIS_PASSWORD=secure-redis-password
REDIS_URL=redis://:password@redis:6379/0

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api/v1
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Optional Variables

```bash
# Email (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## Development Workflow

### Daily Development

```bash
# Start environment
./scripts/docker-dev.sh start

# View logs
./scripts/docker-dev.sh logs
./scripts/docker-dev.sh logs backend

# Run migrations after model changes
./scripts/docker-dev.sh migrate

# Access Django shell
./scripts/docker-dev.sh shell-be

# Stop environment
./scripts/docker-dev.sh stop
```

### Database Management

```bash
# Reset database (development only)
./scripts/docker-dev.sh reset-db

# Create superuser
./scripts/docker-dev.sh superuser

# Run migrations
./scripts/docker-dev.sh migrate
```

### Testing

```bash
# Backend tests
./scripts/docker-dev.sh test backend

# Frontend tests
./scripts/docker-dev.sh test frontend
```

## Production Deployment

### Initial Deployment

1. **Prepare environment:**
   ```bash
   # Create .env with production values
   cp .env.example .env
   nano .env
   ```

2. **Deploy:**
   ```bash
   ./scripts/docker-prod.sh deploy
   ```

3. **Create admin user:**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

### Updates and Maintenance

```bash
# Update application
./scripts/docker-prod.sh update

# Scale services
./scripts/docker-prod.sh scale backend 3

# View logs
./scripts/docker-prod.sh logs

# Health check
./scripts/docker-prod.sh health

# Service status
./scripts/docker-prod.sh status
```

### Backup and Restore

```bash
# Create backup
./scripts/docker-prod.sh backup

# Restore from backup
./scripts/docker-prod.sh restore backup_20231215_143022.sql
```

## SSL/HTTPS Setup

### Using Let's Encrypt

1. **Install Certbot:**
   ```bash
   docker run -it --rm --name certbot \
     -v "/etc/letsencrypt:/etc/letsencrypt" \
     -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
     -p 80:80 \
     certbot/certbot certonly --standalone -d yourdomain.com
   ```

2. **Update nginx configuration:**
   ```bash
   # Copy SSL certificates to docker/ssl/
   cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/
   cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/ssl/
   ```

3. **Update nginx.conf for HTTPS**

### Using Custom Certificates

Place your certificate files in `docker/ssl/`:
- `fullchain.pem` - Certificate chain
- `privkey.pem` - Private key

## Monitoring and Logging

### Log Management

```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Log rotation (add to crontab)
docker-compose -f docker-compose.prod.yml logs --no-color backend > /var/log/nextgencrm-backend.log
```

### Health Checks

The production setup includes health checks for all services:
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- Backend: `curl /api/v1/health/`

### Resource Monitoring

```bash
# Check resource usage
./scripts/docker-prod.sh status

# Detailed container stats
docker stats
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using ports
   sudo lsof -i :8000
   sudo lsof -i :3000
   ```

2. **Permission issues:**
   ```bash
   # Fix file permissions
   sudo chown -R $(whoami):$(whoami) .
   ```

3. **Database connection issues:**
   ```bash
   # Check database logs
   ./scripts/docker-dev.sh logs postgres
   
   # Reset database
   ./scripts/docker-dev.sh reset-db
   ```

4. **Frontend build failures:**
   ```bash
   # Clear node_modules and rebuild
   docker-compose exec frontend rm -rf node_modules
   docker-compose exec frontend npm install
   ```

### Performance Tuning

**PostgreSQL:**
```bash
# Adjust postgresql.conf in production
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

**Redis:**
```bash
# Adjust Redis memory settings
maxmemory 512mb
maxmemory-policy allkeys-lru
```

**Gunicorn:**
```bash
# Adjust worker count based on CPU cores
workers = (2 * CPU_CORES) + 1
```

## Security Considerations

1. **Change default passwords**
2. **Use strong SECRET_KEY and JWT_SECRET_KEY**
3. **Enable firewall rules**
4. **Regular security updates**
5. **Monitor logs for suspicious activity**
6. **Use HTTPS in production**
7. **Restrict database access**

## Scaling

### Horizontal Scaling

```bash
# Scale backend workers
./scripts/docker-prod.sh scale backend 3

# Scale Celery workers
./scripts/docker-prod.sh scale celery-worker 2
```

### Load Balancing

For high availability, place a load balancer (nginx, HAProxy, or cloud load balancer) in front of multiple frontend containers.

### Database Scaling

Consider PostgreSQL read replicas for read-heavy workloads:

```yaml
postgres-replica:
  image: postgres:15-alpine
  environment:
    PGUSER: replicator
    POSTGRES_PASSWORD: ${REPLICA_PASSWORD}
  command: |
    postgres -c wal_level=replica 
             -c max_wal_senders=3 
             -c max_replication_slots=3
```

## Backup Strategy

### Automated Backups

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/NextGenCRM && ./scripts/docker-prod.sh backup

# Weekly cleanup (keep 30 days)
0 3 * * 0 find /path/to/backups -name "backup_*.sql" -mtime +30 -delete
```

### Backup Storage

- Store backups on separate storage
- Consider cloud storage (S3, Google Cloud Storage)
- Test restore procedures regularly

## Support

For issues and questions:
1. Check logs: `./scripts/docker-prod.sh logs`
2. Verify health: `./scripts/docker-prod.sh health`
3. Check service status: `./scripts/docker-prod.sh status`
4. Review environment configuration
5. Consult troubleshooting section