#!/bin/bash

# NextGenCRM Production Docker Script
# This script helps manage the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_env_file() {
    if [ ! -f .env ]; then
        print_error ".env file not found. Please create it with production values."
        print_info "Copy .env.example to .env and update all values for production"
        exit 1
    fi
    
    # Check for default values that should be changed
    if grep -q "your-secret-key-change-in-production" .env; then
        print_error "Please update SECRET_KEY in .env file with a secure value"
        exit 1
    fi
    
    if grep -q "postgres123" .env; then
        print_warning "Using default database password. Consider using a stronger password."
    fi
}

build_services() {
    print_info "Building production Docker services..."
    docker-compose -f docker-compose.prod.yml build
    print_success "Production services built successfully"
}

start_services() {
    print_info "Starting production environment..."
    docker-compose -f docker-compose.prod.yml up -d
    print_success "Production environment started"
}

stop_services() {
    print_info "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    print_success "Production environment stopped"
}

restart_services() {
    print_info "Restarting production environment..."
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d
    print_success "Production environment restarted"
}

deploy() {
    print_info "Deploying NextGenCRM to production..."
    
    # Build services
    build_services
    
    # Run migrations
    print_info "Running database migrations..."
    docker-compose -f docker-compose.prod.yml run --rm backend python manage.py migrate
    
    # Collect static files
    print_info "Collecting static files..."
    docker-compose -f docker-compose.prod.yml run --rm backend python manage.py collectstatic --noinput
    
    # Start services
    start_services
    
    print_success "Deployment completed successfully"
}

backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    print_info "Creating database backup: $backup_file"
    
    docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres nextgencrm > "$backup_file"
    
    print_success "Database backup created: $backup_file"
}

restore_database() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    print_warning "This will restore the database from $backup_file"
    print_warning "Current database will be overwritten!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restoring database from $backup_file..."
        docker-compose -f docker-compose.prod.yml exec -T postgres psql -U postgres nextgencrm < "$backup_file"
        print_success "Database restored successfully"
    else
        print_info "Database restore cancelled"
    fi
}

view_logs() {
    local service=${1:-""}
    if [ -n "$service" ]; then
        print_info "Viewing logs for $service..."
        docker-compose -f docker-compose.prod.yml logs -f "$service"
    else
        print_info "Viewing logs for all services..."
        docker-compose -f docker-compose.prod.yml logs -f
    fi
}

scale_services() {
    local service=$1
    local replicas=$2
    
    if [ -z "$service" ] || [ -z "$replicas" ]; then
        print_error "Usage: $0 scale <service> <replicas>"
        exit 1
    fi
    
    print_info "Scaling $service to $replicas replicas..."
    docker-compose -f docker-compose.prod.yml up -d --scale "$service=$replicas" "$service"
    print_success "Service scaled successfully"
}

update_services() {
    print_info "Updating production services..."
    
    # Pull latest images
    docker-compose -f docker-compose.prod.yml pull
    
    # Rebuild custom images
    build_services
    
    # Rolling update
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Services updated successfully"
}

health_check() {
    print_info "Checking service health..."
    
    # Check if services are running
    docker-compose -f docker-compose.prod.yml ps
    
    echo
    print_info "Testing service endpoints..."
    
    # Test backend health
    if curl -f http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
    fi
    
    # Test frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
    fi
}

cleanup() {
    print_info "Cleaning up unused Docker resources..."
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes (be careful with this)
    read -p "Remove unused volumes? This could delete data! (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume prune -f
    fi
    
    print_success "Cleanup completed"
}

show_status() {
    print_info "Production environment status:"
    docker-compose -f docker-compose.prod.yml ps
    echo
    print_info "Service URLs:"
    echo "  Frontend: http://localhost/ (or your domain)"
    echo "  Backend API: http://localhost/api/v1/"
    echo "  PostgreSQL: Internal only"
    echo "  Redis: Internal only"
    echo
    print_info "Resource usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
}

show_help() {
    echo "NextGenCRM Production Docker Helper"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  build         Build production Docker services"
    echo "  start         Start the production environment"
    echo "  stop          Stop the production environment"
    echo "  restart       Restart the production environment"
    echo "  deploy        Full deployment (build, migrate, start)"
    echo "  backup        Create database backup"
    echo "  restore FILE  Restore database from backup file"
    echo "  logs [svc]    View logs (optionally for specific service)"
    echo "  scale SVC N   Scale service to N replicas"
    echo "  update        Update services with latest code"
    echo "  health        Check service health"
    echo "  cleanup       Clean up unused Docker resources"
    echo "  status        Show service status and resource usage"
    echo "  help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0 deploy"
    echo "  $0 backup"
    echo "  $0 scale backend 3"
    echo "  $0 logs frontend"
}

# Main script logic
case ${1:-""} in
    "build")
        check_env_file
        build_services
        ;;
    "start")
        check_env_file
        start_services
        ;;
    "stop")
        stop_services
        ;;
    "restart")
        restart_services
        ;;
    "deploy")
        check_env_file
        deploy
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database "$2"
        ;;
    "logs")
        view_logs "$2"
        ;;
    "scale")
        scale_services "$2" "$3"
        ;;
    "update")
        update_services
        ;;
    "health")
        health_check
        ;;
    "cleanup")
        cleanup
        ;;
    "status")
        show_status
        ;;
    "help"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo
        show_help
        exit 1
        ;;
esac