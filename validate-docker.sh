#!/bin/bash

# Docker Configuration Validation Script for AmSpec-App v2
# This script validates that all Docker-related files are correctly configured

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

# Validation results
VALIDATION_PASSED=true

# Function to validate file exists
validate_file_exists() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        print_success "$description exists: $file"
    else
        print_error "$description missing: $file"
        VALIDATION_PASSED=false
    fi
}

# Function to validate Dockerfile syntax
validate_dockerfile() {
    print_status "Validating Dockerfile syntax..."
    
    # Check for common Dockerfile issues
    if grep -q "FROM.*AS.*builder" Dockerfile; then
        # Check for duplicate stage names
        local stages=$(grep -o "AS [a-zA-Z0-9-]*" Dockerfile | cut -d' ' -f2 | sort | uniq -d)
        if [ -n "$stages" ]; then
            print_error "Duplicate Docker stage names found: $stages"
            VALIDATION_PASSED=false
        else
            print_success "No duplicate Docker stage names found"
        fi
    fi
    
    # Check for proper base images
    if grep -q "FROM node:18-alpine" Dockerfile; then
        print_success "Using appropriate base images"
    else
        print_error "Missing or incorrect base images"
        VALIDATION_PASSED=false
    fi
    
    # Check for non-root user
    if grep -q "USER " Dockerfile; then
        print_success "Non-root user configured"
    else
        print_warning "Non-root user not configured"
    fi
    
    # Check for health check
    if grep -q "HEALTHCHECK" Dockerfile; then
        print_success "Health check configured"
    else
        print_warning "Health check not configured"
    fi
}

# Function to validate docker-compose files
validate_docker_compose() {
    print_status "Validating docker-compose configuration..."
    
    # Check version
    if grep -q "version: '3.8'" docker-compose.yml; then
        print_success "Docker Compose version specified"
    else
        print_warning "Docker Compose version not specified or incorrect"
    fi
    
    # Check for networks
    if grep -q "networks:" docker-compose.yml; then
        print_success "Networks configured"
    else
        print_warning "Networks not configured"
    fi
    
    # Check for volumes
    if grep -q "volumes:" docker-compose.yml; then
        print_success "Volumes configured"
    else
        print_warning "Volumes not configured"
    fi
    
    # Check for health checks in services
    if grep -q "healthcheck:" docker-compose.yml; then
        print_success "Service health checks configured"
    else
        print_warning "Service health checks not configured"
    fi
}

# Function to validate environment files
validate_environment() {
    print_status "Validating environment configuration..."
    
    if [ -f ".docker.env" ]; then
        # Check for required variables
        local required_vars=("MONGO_ROOT_PASSWORD" "MONGO_USER_PASSWORD" "JWT_SECRET" "JWT_REFRESH_SECRET")
        
        for var in "${required_vars[@]}"; do
            if grep -q "^$var=" .docker.env; then
                print_success "Environment variable found: $var"
                
                # Check if it's a default value that should be changed
                if grep -q "^$var=your-super-secret" .docker.env; then
                    print_warning "Default value detected for $var - should be changed in production"
                fi
            else
                print_error "Missing environment variable: $var"
                VALIDATION_PASSED=false
            fi
        done
    else
        print_error ".docker.env file not found"
        VALIDATION_PASSED=false
    fi
}

# Function to validate .dockerignore
validate_dockerignore() {
    print_status "Validating .dockerignore..."
    
    if [ -f ".dockerignore" ]; then
        # Check for important exclusions
        local important_exclusions=("node_modules" ".git" ".env" "dist")
        
        for exclusion in "${important_exclusions[@]}"; do
            if grep -q "^$exclusion" .dockerignore; then
                print_success "Important exclusion found: $exclusion"
            else
                print_warning "Important exclusion missing: $exclusion"
            fi
        done
    else
        print_error ".dockerignore file not found"
        VALIDATION_PASSED=false
    fi
}

# Function to validate MongoDB initialization
validate_mongodb_init() {
    print_status "Validating MongoDB initialization..."
    
    if [ -f "docker/mongodb/init-mongo.js" ]; then
        # Check for user creation
        if grep -q "createUser" docker/mongodb/init-mongo.js; then
            print_success "MongoDB user creation configured"
        else
            print_warning "MongoDB user creation not found"
        fi
        
        # Check for database creation
        if grep -q "createCollection" docker/mongodb/init-mongo.js; then
            print_success "MongoDB collections creation configured"
        else
            print_warning "MongoDB collections creation not found"
        fi
        
        # Check for indexes
        if grep -q "createIndex" docker/mongodb/init-mongo.js; then
            print_success "MongoDB indexes creation configured"
        else
            print_warning "MongoDB indexes creation not found"
        fi
    else
        print_error "MongoDB initialization script not found"
        VALIDATION_PASSED=false
    fi
}

# Function to validate deployment script
validate_deploy_script() {
    print_status "Validating deployment script..."
    
    if [ -f "deploy.sh" ]; then
        # Check for main functions
        local required_functions=("deploy" "stop" "logs" "backup" "restore" "status")
        
        for func in "${required_functions[@]}"; do
            if grep -q "$func()" deploy.sh; then
                print_success "Deployment function found: $func"
            else
                print_warning "Deployment function missing: $func"
            fi
        done
    else
        print_warning "Deployment script not found"
    fi
}

# Main validation function
main() {
    echo "========================================"
    echo "🐳 Docker Configuration Validation"
    echo "========================================"
    echo ""
    
    # Validate required files exist
    validate_file_exists "Dockerfile" "Dockerfile"
    validate_file_exists "docker-compose.yml" "Docker Compose configuration"
    validate_file_exists ".dockerignore" "Docker ignore file"
    validate_file_exists ".docker.env" "Docker environment file"
    validate_file_exists "deploy.sh" "Deployment script"
    validate_file_exists "DOCKER_DEPLOYMENT.md" "Docker deployment documentation"
    
    echo ""
    
    # Validate file contents
    validate_dockerfile
    echo ""
    
    validate_docker_compose
    echo ""
    
    validate_environment
    echo ""
    
    validate_dockerignore
    echo ""
    
    validate_mongodb_init
    echo ""
    
    validate_deploy_script
    echo ""
    
    # Final result
    echo "========================================"
    if [ "$VALIDATION_PASSED" = true ]; then
        print_success "✅ All validations passed! Docker configuration is ready."
        echo ""
        print_status "Next steps:"
        echo "1. Generate secure JWT secrets: ./deploy.sh generate-secrets"
        echo "2. Deploy the application: ./deploy.sh deploy"
        echo "3. Check application status: ./deploy.sh status"
    else
        print_error "❌ Some validations failed. Please fix the issues above."
        echo ""
        print_status "Refer to DOCKER_DEPLOYMENT.md for guidance."
        exit 1
    fi
    echo "========================================"
}

# Run validation
main "$@"