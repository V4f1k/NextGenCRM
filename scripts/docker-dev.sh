#!/bin/bash

# NextGenCRM Development Docker Script
# This script helps manage the development environment

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
        print_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        print_info "Please update the .env file with your configuration"
    fi
}

build_services() {
    print_info "Building Docker services..."
    docker-compose build
    print_success "Services built successfully"
}

start_services() {
    print_info "Starting development environment..."
    docker-compose up -d
    print_success "Development environment started"
}

stop_services() {
    print_info "Stopping development environment..."
    docker-compose down
    print_success "Development environment stopped"
}

restart_services() {
    print_info "Restarting development environment..."
    docker-compose down
    docker-compose up -d
    print_success "Development environment restarted"
}

view_logs() {
    local service=${1:-""}
    if [ -n "$service" ]; then
        print_info "Viewing logs for $service..."
        docker-compose logs -f "$service"
    else
        print_info "Viewing logs for all services..."
        docker-compose logs -f
    fi
}

run_migrations() {
    print_info "Running database migrations..."
    docker-compose exec backend python manage.py migrate
    print_success "Migrations completed"
}

create_superuser() {
    print_info "Creating Django superuser..."
    docker-compose exec backend python manage.py createsuperuser
}

shell_backend() {
    print_info "Opening Django shell..."
    docker-compose exec backend python manage.py shell
}

shell_frontend() {
    print_info "Opening frontend shell..."
    docker-compose exec frontend sh
}

reset_database() {
    print_warning "This will reset the database and all data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Resetting database..."
        docker-compose down -v
        docker-compose up -d postgres redis
        sleep 5
        docker-compose up -d backend
        sleep 10
        run_migrations
        print_success "Database reset completed"
    else
        print_info "Database reset cancelled"
    fi
}

install_dependencies() {
    print_info "Installing backend dependencies..."
    docker-compose exec backend pip install -r requirements.txt
    
    print_info "Installing frontend dependencies..."
    docker-compose exec frontend npm install
    
    print_success "Dependencies installed"
}

run_tests() {
    local service=${1:-"backend"}
    case $service in
        "backend")
            print_info "Running backend tests..."
            docker-compose exec backend python manage.py test
            ;;
        "frontend")
            print_info "Running frontend tests..."
            docker-compose exec frontend npm test
            ;;
        *)
            print_error "Unknown service: $service. Use 'backend' or 'frontend'"
            exit 1
            ;;
    esac
}

show_status() {
    print_info "Docker Compose status:"
    docker-compose ps
    echo
    print_info "Service URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend API: http://localhost:8000/api/v1/"
    echo "  Django Admin: http://localhost:8000/admin/"
    echo "  PostgreSQL: localhost:5432"
    echo "  Redis: localhost:6379"
}

show_help() {
    echo "NextGenCRM Development Docker Helper"
    echo
    echo "Usage: $0 [COMMAND]"
    echo
    echo "Commands:"
    echo "  build         Build all Docker services"
    echo "  start         Start the development environment"
    echo "  stop          Stop the development environment"
    echo "  restart       Restart the development environment"
    echo "  logs [svc]    View logs (optionally for specific service)"
    echo "  migrate       Run database migrations"
    echo "  superuser     Create Django superuser"
    echo "  shell-be      Open Django shell"
    echo "  shell-fe      Open frontend shell"
    echo "  reset-db      Reset database (WARNING: destroys all data)"
    echo "  install       Install dependencies"
    echo "  test [svc]    Run tests (backend or frontend)"
    echo "  status        Show service status and URLs"
    echo "  help          Show this help message"
    echo
    echo "Examples:"
    echo "  $0 build"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 test frontend"
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
    "logs")
        view_logs "$2"
        ;;
    "migrate")
        run_migrations
        ;;
    "superuser")
        create_superuser
        ;;
    "shell-be")
        shell_backend
        ;;
    "shell-fe")
        shell_frontend
        ;;
    "reset-db")
        reset_database
        ;;
    "install")
        install_dependencies
        ;;
    "test")
        run_tests "$2"
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