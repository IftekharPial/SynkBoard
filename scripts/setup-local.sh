#!/bin/bash

# SynkBoard Local Development Setup Script
# This script sets up the complete SynkBoard development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js version
check_node_version() {
    log_info "Checking Node.js version..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        log_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    log_success "Node.js version: $(node -v)"
}

# Check npm version
check_npm_version() {
    log_info "Checking npm version..."
    
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm 9+ or use Node.js installer"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v | cut -d'.' -f1)
    if [ "$NPM_VERSION" -lt 9 ]; then
        log_error "npm version 9+ is required. Current version: $(npm -v)"
        log_info "Run: npm install -g npm@latest"
        exit 1
    fi
    
    log_success "npm version: $(npm -v)"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install workspace dependencies
    npm run build --if-present
    
    log_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    log_info "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "apps/backend/.env" ]; then
        log_info "Creating backend .env file..."
        cat > apps/backend/.env << EOF
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets (change these in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
EOF
        log_success "Created apps/backend/.env"
    else
        log_warning "Backend .env file already exists, skipping..."
    fi
    
    # Frontend environment
    if [ ! -f "apps/frontend/.env.local" ]; then
        log_info "Creating frontend .env.local file..."
        cat > apps/frontend/.env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=SynkBoard
NEXT_PUBLIC_APP_VERSION=1.0.0

# Development flags
NEXT_PUBLIC_DEBUG=true
EOF
        log_success "Created apps/frontend/.env.local"
    else
        log_warning "Frontend .env.local file already exists, skipping..."
    fi
}

# Setup database
setup_database() {
    log_info "Setting up database..."
    
    # Generate Prisma client
    npm run db:setup
    
    # Run migrations
    npm run db:migrate
    
    # Seed database with sample data
    log_info "Seeding database with sample data..."
    npm run db:seed
    
    log_success "Database setup completed"
}

# Run tests to verify setup
run_tests() {
    log_info "Running tests to verify setup..."
    
    # Run a subset of tests to verify everything works
    npm run test:ci
    
    if [ $? -eq 0 ]; then
        log_success "All tests passed! Setup verification complete."
    else
        log_error "Some tests failed. Please check the output above."
        exit 1
    fi
}

# Create development scripts
create_dev_scripts() {
    log_info "Creating development helper scripts..."
    
    # Create start script
    cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
# Start SynkBoard in development mode

echo "🚀 Starting SynkBoard Development Environment..."
echo ""
echo "Backend will be available at: http://localhost:3001"
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

npm run dev
EOF
    chmod +x scripts/start-dev.sh
    
    # Create reset script
    cat > scripts/reset-db.sh << 'EOF'
#!/bin/bash
# Reset database and reseed with sample data

echo "🔄 Resetting database..."
rm -f apps/backend/dev.db
npm run db:setup
npm run db:migrate
npm run db:seed
echo "✅ Database reset complete!"
EOF
    chmod +x scripts/reset-db.sh
    
    # Create test script
    cat > scripts/run-tests.sh << 'EOF'
#!/bin/bash
# Run comprehensive test suite

echo "🧪 Running SynkBoard Test Suite..."
echo ""

# Run tests with coverage
npm run test:coverage

echo ""
echo "📊 Test Results Summary:"
echo "- Unit Tests: Backend API, Frontend Components, Shared Utilities"
echo "- Integration Tests: Complete workflows and database operations"
echo "- E2E Tests: User journeys and critical paths"
echo ""
echo "Coverage reports available in ./coverage/"
EOF
    chmod +x scripts/run-tests.sh
    
    log_success "Development scripts created in ./scripts/"
}

# Display setup completion message
display_completion_message() {
    echo ""
    echo "🎉 SynkBoard Local Development Setup Complete!"
    echo ""
    echo "📋 What's been set up:"
    echo "  ✅ Node.js and npm versions verified"
    echo "  ✅ Dependencies installed"
    echo "  ✅ Environment files created"
    echo "  ✅ Database initialized and seeded"
    echo "  ✅ Tests verified"
    echo "  ✅ Development scripts created"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo "  Start development:  ./scripts/start-dev.sh"
    echo "  Run tests:          ./scripts/run-tests.sh"
    echo "  Reset database:     ./scripts/reset-db.sh"
    echo ""
    echo "🌐 Access URLs:"
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:3001"
    echo "  API Docs:  http://localhost:3001/api/v1"
    echo ""
    echo "📚 Next Steps:"
    echo "  1. Review the .env files and update secrets for production"
    echo "  2. Read TESTING.md for testing guidelines"
    echo "  3. Check .augment/rules/ for development rules and patterns"
    echo "  4. Start coding! The development environment is ready."
    echo ""
    echo "🆘 Need Help?"
    echo "  - Check TESTING.md for testing instructions"
    echo "  - Review .augment/rules/index.md for project guidelines"
    echo "  - Run 'npm run test' to verify everything works"
    echo ""
}

# Main setup function
main() {
    echo "🔧 SynkBoard Local Development Setup"
    echo "===================================="
    echo ""
    
    # Check prerequisites
    check_node_version
    check_npm_version
    
    # Setup steps
    install_dependencies
    setup_environment
    setup_database
    create_dev_scripts
    
    # Verify setup
    run_tests
    
    # Show completion message
    display_completion_message
}

# Handle script interruption
trap 'log_error "Setup interrupted by user"; exit 1' INT

# Run main function
main "$@"
