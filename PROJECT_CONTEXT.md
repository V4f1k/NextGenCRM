# NextGenCRM - Project Context & Development Plan

## Project Overview
NextGenCRM is a modern, full-featured CRM system built as a complete replacement for EspoCRM using Django REST Framework (backend) and React TypeScript (frontend). The goal is to replicate all EspoCRM functionality while using modern, maintainable technologies.

## Current Status: ✅ COMPLETE CRM SYSTEM WITH ENHANCED WORKFLOW & DRAG-DROP (2025-06-13)

### Technology Stack
- **Backend**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL (SQLite for development)
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Authentication**: JWT tokens
- **Drag & Drop**: React DnD with HTML5 backend
- **Real-time**: Django Channels (configured, not implemented)
- **Task Queue**: Celery + Redis (configured and implemented in Docker)
- **Deployment**: Docker + Docker Compose
- **Web Server**: Nginx (production)
- **WSGI Server**: Gunicorn (production)

## Project Structure
```
NextGenCRM/
├── backend/                    # Django REST API
│   ├── nextgencrm/            # Django project settings
│   ├── apps/                  # Django applications
│   │   ├── core/              # Base models and utilities
│   │   ├── users/             # User management and authentication
│   │   ├── crm/               # Core CRM entities
│   │   ├── emails/            # Email management (placeholder)
│   │   ├── files/             # File management (placeholder)
│   │   └── workflows/         # Workflow automation (placeholder)
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment configuration
│   └── db.sqlite3            # Development database
├── frontend/                  # React TypeScript SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks (placeholder)
│   │   ├── services/         # API services (placeholder)
│   │   ├── types/            # TypeScript type definitions (placeholder)
│   │   └── utils/            # Utility functions (placeholder)
│   ├── package.json          # Node.js dependencies
│   └── tailwind.config.js    # Tailwind CSS configuration
├── docker/                   # Docker configuration files
│   ├── Dockerfile.backend     # Multi-stage Django Dockerfile
│   ├── Dockerfile.frontend    # Multi-stage React Dockerfile  
│   ├── nginx.conf            # Production Nginx configuration
│   ├── env.sh                # Environment injection script
│   └── init-db.sql           # Database initialization
├── scripts/                  # Deployment and management scripts
│   ├── docker-dev.sh         # Development environment helper
│   └── docker-prod.sh        # Production deployment helper
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production environment
├── .env.example              # Environment variables template
├── .dockerignore             # Docker ignore patterns
├── README-Docker.md          # Comprehensive Docker documentation
├── shared/                   # Shared utilities (placeholder)
├── docs/                     # Documentation (placeholder)
└── tests/                    # E2E tests (placeholder)
```

## ✅ Completed Features

### Backend Implementation
1. **Django Project Setup**
   - Complete Django 4.2 setup with REST framework
   - Modular app architecture (core, users, crm, emails, files, workflows)
   - Environment-based configuration with django-environ
   - PostgreSQL and Redis configuration (SQLite for development)

2. **Database Models** - All major EspoCRM entities implemented:
   
   **User Management:**
   - `User` - Custom user model with CRM-specific fields
   - `Team` - Team organization with user relationships  
   - `Role` - Permission management with JSON data storage
   - `UserRole`, `TeamRole`, `TeamUser` - Relationship tables

   **Core CRM Entities:**
   - `Account` - Companies/organizations with full address and contact info
   - `Contact` - Individual people with account relationships
   - `Lead` - Potential customers with conversion tracking
   - `Opportunity` - Sales deals with stage management and probability
   - `Task` - Action items with generic relationship support
   - `Call` - Phone calls and meetings with participants
   - All models include comprehensive choice constants for status, type, industry fields

   **Base Model Features:**
   - UUID primary keys (like EspoCRM)
   - Automatic timestamps (created_at, modified_at)
   - Soft delete functionality (deleted, deleted_at)
   - Assignment tracking (created_by, modified_by, assigned_user, assigned_team)
   - Address mixins (billing, shipping, general)
   - Contact info mixins (email, phone with validation flags)
   - Tagging support with JSON fields

3. **Authentication System**
   - Custom User model extending AbstractBaseUser
   - JWT token configuration with refresh tokens
   - User manager with email/username authentication
   - Role-based access control foundation
   - Complete JWT authentication flow with login/logout/refresh

4. **REST API Implementation** - Full CRUD API for all entities:
   
   **Authentication Endpoints:**
   - `POST /api/v1/auth/login/` - User login with JWT tokens
   - `POST /api/v1/auth/refresh/` - Token refresh
   - `POST /api/v1/auth/register/` - User registration
   - `POST /api/v1/auth/logout/` - User logout
   - `GET /api/v1/profile/` - Get user profile
   - `PATCH /api/v1/profile/` - Update user profile
   
   **CRM Entity Endpoints:**
   - Full CRUD operations for Accounts, Contacts, Leads, Opportunities, Tasks, Calls
   - Advanced filtering with django-filter integration
   - Search functionality across relevant fields
   - Pagination support with count and next/previous links
   - Soft delete implementation
   - Assignment tracking with user relationships
   
   **Dashboard & Analytics:**
   - `GET /api/v1/dashboard/stats/` - Real-time statistics for all entities
   - `GET /api/v1/dashboard/activities/` - Recent activity feed
   
   **API Features:**
   - JWT Bearer token authentication required for all protected endpoints
   - Comprehensive serializers with list/detail views
   - Related object name resolution (account names, user names, etc.)
   - Automatic created_by/modified_by tracking
   - Choice field validation with predefined constants

### Frontend Implementation
1. **React Application Setup**
   - React 19 + TypeScript + Vite
   - TanStack Query for state management
   - React Router for navigation
   - React Hook Form + Zod for form validation
   - Tailwind CSS with custom design system

2. **UI Components & Pages**
   - **Layout Component** - Professional sidebar navigation with responsive design
   - **Dashboard** - Statistics cards, recent activity, quick actions
   - **Login Page** - Form validation, password visibility toggle, JWT integration
   - **Accounts Page** - Data table with search and filters
   - **Placeholder Pages** - Contacts, Leads, Opportunities, Tasks
   - **Authentication Flow** - Complete login/logout with protected routes
   - **Auth Context** - Global authentication state management

3. **Design System**
   - Custom Tailwind configuration with CRM-appropriate colors
   - Button variants (primary, secondary, outline, ghost)
   - Card components and input styling
   - Professional typography with Inter font
   - Responsive design patterns

## Development Environment Setup

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Setup  
```bash
cd frontend
npm install
npm run dev
```

### Environment Configuration
- **Backend**: Copy `.env.example` to `.env` and configure settings
- **Database**: SQLite for development, PostgreSQL for production
- **Authentication**: JWT tokens with configurable lifetime

## ✅ RECENTLY COMPLETED (2025-06-13)

### 1. Enhanced CRM Workflow Implementation ✅ COMPLETED
- ✅ **Updated Lead Workflow**: Simplified 5-stage process (New → Contacted → In Qualification → Disqualified → Converted to Opportunity)
- ✅ **Updated Opportunity Pipeline**: Streamlined 6-stage process (Prospecting → Qualification → Proposal → Negotiation → Closed Won/Lost)
- ✅ **Database Migration**: Automatic mapping of old workflow values to new stages with data preservation
- ✅ **Frontend Type Updates**: Complete TypeScript interface updates for new workflow
- ✅ **Backend Model Updates**: Django model choices updated with proper validation

### 2. Drag & Drop Pipeline Functionality ✅ COMPLETED
- ✅ **React DnD Integration**: Implemented with HTML5 backend for professional drag and drop
- ✅ **Draggable Opportunity Cards**: Interactive cards with visual feedback and grip indicators
- ✅ **Droppable Stage Columns**: Each pipeline stage accepts dropped opportunities
- ✅ **Automatic Stage Updates**: Real-time API calls to update opportunity stages on drop
- ✅ **Visual Feedback**: Hover effects, drag indicators, and smooth transitions
- ✅ **Error Handling**: Toast notifications for successful/failed stage updates

### 3. UI/UX Improvements ✅ COMPLETED  
- ✅ **Terminology Consistency**: Changed "Account" to "Organization" throughout the application
- ✅ **Pipeline Visualization**: Complete 6-column pipeline view with all stages visible
- ✅ **Lead Conversion Logic**: Updated to use new workflow statuses with smart re-conversion
- ✅ **Form Validations**: Updated all forms to work with new workflow stages
- ✅ **Responsive Design**: Improved grid layouts for different screen sizes

### 4. Bug Fixes & Optimizations ✅ COMPLETED
- ✅ **i18n Import Issues**: Fixed Docker environment compatibility issues
- ✅ **Organization/Contact Column Data**: Fixed API serializers to properly display related data
- ✅ **Lead Conversion Authentication**: Resolved JWT token refresh issues
- ✅ **Form Field Mappings**: Corrected field mismatches between frontend and backend

## ✅ PREVIOUSLY COMPLETED (2025-06-12)

### 1. REST API Implementation ✅ COMPLETED
- ✅ Created comprehensive Django REST Framework serializers for all models
- ✅ Implemented ViewSets with full CRUD operations
- ✅ Added advanced filtering, searching, and pagination
- ✅ URL routing and API endpoint structure
- ✅ JWT authentication middleware and permissions

### 2. Authentication Flow ✅ COMPLETED  
- ✅ JWT token authentication in frontend with authService
- ✅ Complete login/logout functionality
- ✅ Protected routes with auth context
- ✅ Automatic token refresh mechanism
- ✅ User profile management endpoints

### 3. Backend API Testing ✅ COMPLETED
- ✅ Successfully tested login endpoint (JWT tokens working)
- ✅ Account creation and CRUD operations functional
- ✅ Dashboard statistics endpoint working
- ✅ Bearer token authentication verified
- ✅ All major CRM endpoints operational

### 4. Frontend-Backend Integration ✅ COMPLETED
- ✅ TypeScript interfaces matching all Django models
- ✅ Comprehensive API service layer with error handling
- ✅ TanStack Query hooks for all CRUD operations
- ✅ Real-time Dashboard with live API data
- ✅ Interactive Accounts page with search, filtering, and mutations
- ✅ Complete type safety between frontend and backend
- ✅ Automatic token refresh and authentication handling
- ✅ Loading states, error handling, and user feedback

### 5. Enhanced UI Components ✅ COMPLETED
- ✅ Toast notification system with multiple types (success, error, warning, info)
- ✅ Modal components with customizable sizes and behaviors
- ✅ Confirmation dialogs with loading states
- ✅ Advanced data table with sorting, pagination, and selection
- ✅ Account creation and edit forms with comprehensive validation
- ✅ Professional loading states and skeleton screens
- ✅ Responsive design patterns and animations
- ✅ Context-based notification management

### 6. Complete CRM Pages Implementation ✅ COMPLETED
- ✅ **Contacts Page** - Full CRUD operations with account relationship management
  - Contact creation and editing forms with account selection dropdown
  - Professional data table with contact avatars and status indicators
  - Search and filtering capabilities with real-time API integration
  - Account relationship display with building icons and names
- ✅ **Leads Page** - Lead management with conversion workflow and statistics
  - Lead creation forms with status management and visual indicators
  - Lead conversion workflow (placeholder for future implementation)
  - Lead statistics dashboard with status counts (New, In Process, Converted)
  - Advanced data table with lead status and source indicators
  - Color-coded status and source badges for quick visual reference
- ✅ **Opportunities Page** - Professional sales pipeline management
  - **Dual View Modes**: Traditional table view and visual Kanban-style pipeline
  - **Pipeline Visualization**: Opportunities grouped by sales stage with drag-and-drop ready structure
  - **Advanced Metrics**: Total pipeline value, weighted pipeline, average deal size calculations
  - **Interactive Pipeline**: Click to edit opportunities directly from pipeline cards
  - **Stage Management**: Auto-updating probability based on sales stage
  - **Overdue Detection**: Red highlighting for overdue close dates
- ✅ **Tasks Page** - Comprehensive task management system
  - **Task Metrics Dashboard**: Total, completed, overdue, and due today counts
  - **Overdue Detection**: Automatic overdue task identification with visual alerts
  - **Related Entity Display**: Shows relationships to accounts, contacts, opportunities
  - **Status Filtering**: Quick filter dropdown for task status
  - **Priority & Status Indicators**: Color-coded badges for quick visual reference
  - **Scheduling**: Date/time management with start and due dates

### 7. Docker Production Deployment ✅ COMPLETED
- ✅ **Multi-stage Dockerfiles** for optimized production builds
  - Separate development and production stages
  - Non-root user security implementation
  - Optimized layer caching and build size
- ✅ **Production-ready Docker Compose** configuration
  - PostgreSQL with persistent data volumes
  - Redis with password protection
  - Nginx reverse proxy with security headers
  - Celery workers for background tasks
  - Celery beat for scheduled tasks
- ✅ **Development Environment** setup
  - Hot-reload for both frontend and backend
  - Database and Redis containers
  - Volume mounting for live code changes
- ✅ **Management Scripts** for easy deployment
  - `docker-dev.sh` - Development environment helper
  - `docker-prod.sh` - Production deployment automation
  - Health checks, scaling, backup/restore functionality
- ✅ **Comprehensive Documentation** 
  - Complete Docker setup guide in README-Docker.md
  - Environment configuration examples
  - Production deployment procedures
  - Troubleshooting and maintenance guides

## ⏳ Advanced Features (Future Development)

### 1. Advanced Features & Polish
- [ ] Global search functionality across all entities
- [ ] Bulk operations (select multiple, bulk delete, bulk edit)
- [ ] Export functionality (CSV, Excel, PDF)
- [ ] Import functionality with validation
- [ ] Advanced filtering with date ranges and complex conditions
- [ ] User preferences and customizable layouts

### 2. Form Creation & Management
- [ ] Dynamic form builder for entities
- [ ] Validation rules and error handling
- [ ] File upload functionality
- [ ] Rich text editor integration
- [ ] Auto-save and draft functionality

### 3. Email System Implementation
- [ ] Email models (Email, EmailTemplate, Campaign)
- [ ] SMTP integration for sending emails
- [ ] Email templates with variable substitution
- [ ] Email tracking and analytics
- [ ] Cold email automation (port from existing EspoCRM setup)

## 🚀 Advanced Features (Future Development)

### 4. Workflow Automation
- [ ] Workflow models and rule engine
- [ ] Trigger-based actions
- [ ] Email automation sequences
- [ ] Task automation
- [ ] Custom field support

### 5. Reporting & Analytics
- [ ] Report builder interface
- [ ] Dashboard customization
- [ ] Charts and graphs with Recharts
- [ ] Export functionality (PDF, Excel)
- [ ] Custom dashboards per user/role

### 6. File Management
- [ ] File upload and storage
- [ ] Document management
- [ ] Image handling and thumbnails
- [ ] File sharing and permissions

### 7. Real-time Features
- [ ] WebSocket implementation with Django Channels
- [ ] Live notifications
- [ ] Real-time collaboration
- [ ] Activity feeds

### 8. Production Readiness
- [x] Docker containerization ✅ **COMPLETED**
- [ ] CI/CD pipeline setup (GitHub Actions, GitLab CI)
- [x] Production database migrations ✅ **COMPLETED** 
- [x] Security hardening (non-root users, security headers) ✅ **COMPLETED**
- [ ] Performance optimization (caching, CDN integration)
- [ ] Monitoring and logging (Prometheus, Grafana, ELK stack)

## Technical Decisions & Architecture

### Django Backend Architecture
- **Modular Apps**: Separated concerns (users, crm, emails, etc.)
- **Base Models**: Reusable abstractions for UUID, timestamps, soft delete
- **Custom User Model**: Extended authentication with CRM fields
- **JSON Fields**: Flexible data storage for roles, tags, settings
- **Generic Relationships**: Task and Call models can link to any entity

### Frontend Architecture
- **Component-Based**: Reusable UI components with consistent styling
- **Type Safety**: Full TypeScript coverage for API and UI
- **State Management**: TanStack Query for server state, React state for UI
- **Form Handling**: React Hook Form for performance, Zod for validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### API Design Principles
- **RESTful**: Standard HTTP methods and status codes
- **Consistent**: Uniform response format and error handling
- **Filterable**: Advanced querying capabilities
- **Paginated**: Efficient large dataset handling
- **Documented**: Auto-generated API documentation

## Database Schema Overview

### User Management Tables
- `users` - Custom user model with CRM fields
- `teams` - Team organization
- `roles` - Permission definitions with JSON data
- `user_roles`, `team_roles`, `team_users` - Relationship tables

### Core CRM Tables
- `accounts` - Companies/organizations
- `contacts` - Individual people
- `leads` - Potential customers
- `opportunities` - Sales deals
- `tasks` - Action items
- `calls` - Phone calls/meetings
- `opportunity_contacts`, `call_contacts`, `call_users` - Relationship tables

### System Tables
- `settings` - System configuration
- `system_data` - Internal system state
- Standard Django tables (auth, sessions, etc.)

## Environment Configuration

### Backend (.env)
```bash
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3  # Development
# DATABASE_URL=postgresql://user:pass@localhost/nextgencrm  # Production
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your-jwt-secret
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend (environment variables)
```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Testing Strategy
- **Backend**: Django test framework + pytest
- **Frontend**: Vitest + React Testing Library
- **E2E**: Cypress (planned)
- **API**: Postman/Insomnia collections

## Deployment Strategy
- **Development**: Local SQLite + npm dev server
- **Staging**: Docker Compose with PostgreSQL
- **Production**: Kubernetes or Docker Swarm with managed database

## Security Considerations
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **CORS**: Configured for frontend domains
- **CSRF**: Django CSRF protection
- **SQL Injection**: Django ORM protection
- **XSS**: React automatic escaping + DOMPurify

## Performance Optimization
- **Database**: Indexes on frequently queried fields
- **API**: Pagination and field selection
- **Frontend**: Code splitting and lazy loading
- **Caching**: Redis for session and query caching
- **CDN**: Static asset delivery (production)

## Monitoring & Logging
- **Backend**: Django logging with structured output
- **Frontend**: Error boundaries and crash reporting
- **Infrastructure**: Application and database monitoring
- **Analytics**: User behavior tracking (optional)

---

## Quick Start Commands

### Development
```bash
# Backend
cd backend && source venv/bin/activate && python manage.py runserver

# Frontend  
cd frontend && npm run dev

# Both (in separate terminals)
```

### Database Operations
```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Django shell
python manage.py shell
```

### Common Development Tasks
```bash
# Install new Python package
pip install package-name && pip freeze > requirements.txt

# Install new npm package
npm install package-name

# Run tests
python manage.py test  # Backend
npm run test          # Frontend

# Code formatting
black .               # Python
npm run lint:fix      # TypeScript
```

---

## Notes for Future Development

### Code Quality
- Follow Django REST Framework best practices
- Use TypeScript strict mode
- Implement comprehensive error handling
- Write unit tests for business logic
- Document complex algorithms

### Scalability Considerations
- Design for horizontal scaling
- Implement caching strategies
- Use database connection pooling
- Consider microservices for large deployments

### User Experience
- Optimize for common workflows
- Implement keyboard shortcuts
- Provide helpful error messages
- Support offline functionality (PWA)

### Integration Points
- Email service providers (SendGrid, Mailgun)
- Calendar systems (Google Calendar, Outlook)
- Document storage (AWS S3, Google Drive)
- Third-party CRM data imports

## ✅ CRITICAL DOCKER + VITE IMPORT RESOLUTION ISSUE RESOLVED (2025-06-13)

### 🚨 **Problem**: Drag-and-Drop Libraries Import Failures After Docker Restart

**Issue Description:**
After Docker container restarts, systematic import resolution failures occurred for ALL drag-and-drop libraries:
```
[plugin:vite:import-analysis] Failed to resolve import '@dnd-kit/core'
[plugin:vite:import-analysis] Failed to resolve import 'react-dnd'  
[plugin:vite:import-analysis] Failed to resolve import '@atlaskit/pragmatic-drag-and-drop'
```

**Root Causes Identified:**
1. **Docker Volume Mount Issues**: Named volume `frontend_node_modules` wasn't properly populated with host dependencies
2. **Vite Cache Corruption**: Cache in `node_modules/.vite/` and `node_modules/.tmp/` became stale after Docker restarts
3. **TypeScript `verbatimModuleSyntax` Conflicts**: Strict TS 5.0+ feature conflicted with many npm packages
4. **Module Resolution Pipeline**: Vite's bundler mode + Docker caused systematic resolution failures

### ✅ **Complete Solution Implemented**

#### 1. **Enhanced Vite Configuration** (`frontend/vite.config.ts`)
```typescript
export default defineConfig({
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-router-dom', '@tanstack/react-query',
      'axios', 'lucide-react', 'clsx', 'zod', '@hookform/resolvers', 'react-hook-form',
      // Drag and drop libraries - critical for Docker compatibility
      '@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities',
      'react-dnd', 'react-dnd-html5-backend',
      '@atlaskit/pragmatic-drag-and-drop', '@atlaskit/pragmatic-drag-and-drop-hitbox'
    ],
    force: true, // Force rebuild to clear cache issues after Docker restart
  },
  server: {
    host: '0.0.0.0', port: 5173,
    watch: { usePolling: true, interval: 1000 },
    hmr: { port: 5173 }
  }
})
```

#### 2. **TypeScript Configuration Fix** (`frontend/tsconfig.app.json`)
```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": false  // Disabled for npm package compatibility
  }
}
```

#### 3. **Docker Configuration** (`docker-compose.yml`)
```yaml
frontend:
  volumes:
    - ./frontend:/app
    - frontend_node_modules:/app/node_modules  # Named volume prevents binary conflicts
```

#### 4. **Dockerfile Enhancement** (`docker/Dockerfile.frontend`)
```dockerfile
# Clear cache on container start
CMD ["sh", "-c", "rm -rf node_modules/.vite node_modules/.tmp 2>/dev/null || true && npm run dev:docker"]
```

#### 5. **Cache Management Scripts** (`frontend/package.json`)
```json
{
  "scripts": {
    "dev:docker": "vite --host 0.0.0.0 --force",
    "clear-cache": "rm -rf node_modules/.vite && rm -rf node_modules/.tmp",
    "docker:clear-cache": "docker exec nextgencrm-frontend rm -rf /app/node_modules/.vite && docker exec nextgencrm-frontend rm -rf /app/node_modules/.tmp",
    "docker:rebuild": "docker-compose down && docker volume rm nextgencrm_frontend_node_modules 2>/dev/null || true && docker-compose up --build",
    "docker:restart": "docker-compose restart frontend",
    "docker:fix-imports": "npm run docker:clear-cache && npm run docker:restart"
  }
}
```

### 🚀 **Quick Recovery Commands**

**Most Common Fix:**
```bash
npm run docker:fix-imports
```

**Alternative Quick Fix:**
```bash
npm run docker:clear-cache && npm run docker:restart
```

**Full Rebuild (if needed):**
```bash
npm run docker:rebuild
```

### 📋 **Prevention Strategy**

1. **Named Volumes**: Always use named volumes for `node_modules` in Docker
2. **Force Cache Rebuild**: Force Vite to rebuild cache after environment changes  
3. **Explicit Pre-bundling**: Include all drag-drop libraries in `optimizeDeps.include`
4. **TypeScript Compatibility**: Disable strict features that conflict with npm packages

### ✅ **Results Achieved**

- ✅ **All drag-drop libraries work**: @dnd-kit, react-dnd, @atlaskit/pragmatic-drag-and-drop
- ✅ **Docker restart reliability**: No more import failures after container restarts
- ✅ **Vite optimization**: Proper dependency pre-bundling and cache management
- ✅ **Development workflow**: Smooth HMR and development experience maintained

### 📖 **Documentation Created**

**Comprehensive troubleshooting guide:** `frontend/DOCKER_TROUBLESHOOTING.md`
- Complete root cause analysis
- Step-by-step recovery procedures  
- Prevention best practices
- Environment-specific notes (macOS, Linux, Windows + Docker)

### 🎯 **Key Insight**

This was **NOT a library-specific issue** but a **systematic Docker + Vite infrastructure problem**. The same solution works for ANY npm package that experiences import resolution failures after Docker restarts.

### 🔧 **Current Implementation**

The Opportunities page now successfully uses **react-dnd** with full drag-and-drop pipeline functionality, demonstrating that the systematic fix works for all drag-drop libraries.

---

This document should be updated as the project evolves and new features are implemented.