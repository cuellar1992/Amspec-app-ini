#!/bin/bash

# AmSpec-App v2 Docker Deployment Script
# This script helps deploy the application using Docker Compose

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
}

# Function to generate JWT secrets
generate_secrets() {
    print_status "Generating secure JWT secrets..."
    
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    # Update .docker.env file
    if [ -f .docker.env ]; then
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .docker.env
        sed -i "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" .docker.env
        print_success "JWT secrets generated and updated in .docker.env"
    else
        print_error ".docker.env file not found. Please create it first."
        exit 1
    fi
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment..."
    
    # Check if .docker.env exists
    if [ ! -f .docker.env ]; then
        print_error ".docker.env file not found. Please copy it from the template and configure it."
        exit 1
    fi
    
    # Check if secrets are default values
    if grep -q "your-super-secret-jwt-key-change-this" .docker.env; then
        print_warning "Default JWT secrets detected. Generating new secure secrets..."
        generate_secrets
    fi
    
    print_success "Environment validation completed"
}

# Function to deploy the application
deploy() {
    local mode=${1:-production}
    
    print_status "Deploying AmSpec-App in $mode mode..."
    
    if [ "$mode" = "development" ]; then
        # Development mode with hot reload
        docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
    else
        # Production mode
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        
        print_status "Waiting for application to be healthy..."
        sleep 30
        
        # Check health
        if curl -f http://localhost:8080/health > /dev/null 2>&1; then
            print_success "Deployment successful! Application is healthy."
            print_status "Frontend: http://localhost:8080"
            print_status "API: http://localhost:8080/api"
            print_status "Health Check: http://localhost:8080/health"
        else
            print_error "Deployment failed! Application is not healthy."
            print_status "Checking logs..."
            docker-compose logs --tail=50 app
            exit 1
        fi
    fi
}

# Function to stop the application
stop() {
    print_status "Stopping AmSpec-App..."
    docker-compose down
    print_success "Application stopped"
}

# Function to show logs
logs() {
    local service=${1:-app}
    print_status "Showing logs for $service..."
    docker-compose logs -f "$service"
}

# Function to backup data
backup() {
    local backup_dir="backup/$(date +%Y%m%d_%H%M%S)"
    
    print_status "Creating backup in $backup_dir..."
    mkdir -p "$backup_dir"
    
    # Backup MongoDB
    print_status "Backing up MongoDB..."
    docker-compose exec -T mongodb mongodump --archive | gzip > "$backup_dir/mongodb.gz"
    
    # Backup uploads
    print_status "Backing up uploads..."
    docker run --rm -v amspec_app_uploads:/data -v "$(pwd)/$backup_dir":/backup alpine tar czf /backup/uploads.tar.gz -C /data .
    
    print_success "Backup completed: $backup_dir"
}

# Function to restore data
restore() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        print_error "Please specify a backup directory"
        exit 1
    fi
    
    if [ ! -d "$backup_dir" ]; then
        print_error "Backup directory $backup_dir not found"
        exit 1
    fi
    
    print_warning "This will replace all current data. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restoring from $backup_dir..."
        
        # Restore MongoDB
        if [ -f "$backup_dir/mongodb.gz" ]; then
            print_status "Restoring MongoDB..."
            gunzip -c "$backup_dir/mongodb.gz" | docker-compose exec -T mongodb mongorestore --archive
        fi
        
        # Restore uploads
        if [ -f "$backup_dir/uploads.tar.gz" ]; then
            print_status "Restoring uploads..."
            docker run --rm -v amspec_app_uploads:/data -v "$(pwd)/$backup_dir":/backup alpine tar xzf /backup/uploads.tar.gz -C /data
        fi
        
        print_success "Restore completed"
    else
        print_status "Restore cancelled"
    fi
}

# Function to show status
status() {
    print_status "Application status:"
    docker-compose ps
    
    print_status "\nHealth check:"
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        print_success "Application is healthy"
    else
        print_error "Application is not healthy"
    fi
}

# Function to show help
show_help() {
    echo "AmSpec-App v2 Docker Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  deploy [production|development]  Deploy the application (default: production)"
    echo "  stop                           Stop the application"
    echo "  logs [service]                  Show logs for a service (default: app)"
    echo "  backup                         Create a backup of application data"
    echo "  restore <backup_dir>            Restore from backup directory"
    echo "  status                         Show application status"
    echo "  generate-secrets                Generate new JWT secrets"
    echo "  help                           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 deploy                      # Deploy in production mode"
    echo "  $0 deploy development           # Deploy in development mode"
    echo "  $0 logs app                   # Show application logs"
    echo "  $0 logs mongodb               # Show MongoDB logs"
    echo "  $0 backup                     # Create backup"
    echo "  $0 restore backup_20231201_120000  # Restore from backup"
    echo ""
}

# Main script logic
main() {
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Parse command line arguments
    case "${1:-help}" in
        deploy)
            validate_environment
            deploy "${2:-production}"
            ;;
        stop)
            stop
            ;;
        logs)
            logs "${2:-app}"
            ;;
        backup)
            backup
            ;;
        restore)
            restore "$2"
            ;;
        status)
            status
            ;;
        generate-secrets)
            generate_secrets
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"