# NextGenCRM

A modern, full-featured CRM system built with Django REST Framework and React TypeScript, designed as a complete replacement for EspoCRM with enhanced performance and maintainability.

## 🚀 Production-Ready CRM System

NextGenCRM is a **complete, production-ready CRM solution** featuring:
- **Full CRUD operations** for all CRM entities
- **Professional UI** with advanced data tables, forms, and dashboards
- **Docker deployment** for development and production environments
- **TypeScript-first** architecture for type safety
- **Modern tech stack** optimized for performance and scalability

## ✨ Key Features

### Core CRM Functionality
- **Complete Entity Management**: Accounts, Contacts, Leads, Opportunities, Tasks, Calls
- **Advanced Dashboard**: Real-time statistics and activity feeds
- **Professional UI Components**: Data tables with sorting, filtering, pagination
- **Form Validation**: Comprehensive form handling with Zod validation
- **Authentication**: JWT-based authentication with automatic token refresh

### Technical Excellence
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Modern Architecture**: Clean separation of concerns with service layers
- **Production-Ready**: Docker containerization with multi-stage builds
- **Performance Optimized**: TanStack Query for efficient data fetching
- **Developer Experience**: Hot reload, comprehensive error handling

## 🏗️ Architecture

- **Backend**: Django 4.2 + Django REST Framework
- **Database**: PostgreSQL (SQLite for development)
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query + React Context
- **Authentication**: JWT tokens with refresh mechanism
- **Forms**: React Hook Form + Zod validation
- **Deployment**: Docker + Docker Compose
- **Task Queue**: Celery + Redis (production)

## 📁 Project Structure

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
│   └── .env                   # Environment configuration
├── frontend/                  # React TypeScript SPA
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript type definitions
│   │   └── hooks/            # Custom React hooks
│   ├── package.json          # Node.js dependencies
│   └── tailwind.config.js    # Tailwind CSS configuration
├── docker/                   # Docker configuration files
├── scripts/                  # Deployment and management scripts
├── docker-compose.yml        # Development environment
├── docker-compose.prod.yml   # Production environment
└── README-Docker.md          # Docker documentation
```

## 🚀 Quick Start

### Development Environment

#### Option 1: Docker (Recommended)
```bash
# Clone the repository
git clone git@github.com:V4f1k/NextGenCRM.git
cd NextGenCRM

# Start development environment
./scripts/docker-dev.sh start

# Run initial setup
./scripts/docker-dev.sh migrate
./scripts/docker-dev.sh superuser

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/api/v1/
# Django Admin: http://localhost:8000/admin/
```

#### Option 2: Manual Setup
```bash
# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Production Deployment

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with production values

# Deploy to production
./scripts/docker-prod.sh deploy

# Access the application
# Frontend: http://localhost/ (or your domain)
# Backend API: http://localhost/api/v1/
```

## 🛠️ Management Scripts

The project includes comprehensive management scripts for easy development and deployment:

### Development (`./scripts/docker-dev.sh`)
- `start` - Start development environment
- `stop` - Stop development environment
- `migrate` - Run database migrations
- `superuser` - Create Django superuser
- `logs [service]` - View logs
- `test [backend|frontend]` - Run tests
- `status` - Show service status

### Production (`./scripts/docker-prod.sh`)
- `deploy` - Full production deployment
- `backup` - Create database backup
- `restore [file]` - Restore from backup
- `scale [service] [count]` - Scale services
- `health` - Check service health
- `status` - Show production status

## 📊 Entity Management

### Implemented Entities
- **Accounts** - Companies/organizations with full contact information
- **Contacts** - Individual people with account relationships
- **Leads** - Potential customers with conversion tracking
- **Opportunities** - Sales deals with pipeline visualization
- **Tasks** - Action items with assignment and due dates
- **Calls** - Phone calls and meetings (placeholder)

### Entity Features
- **CRUD Operations** - Create, read, update, delete with validation
- **Relationships** - Complex relationships between entities
- **Search & Filter** - Advanced filtering and search capabilities
- **Pagination** - Efficient handling of large datasets
- **Soft Delete** - Safe deletion with recovery options
- **Assignment** - User and team assignment tracking

## 🎨 UI Components

### Professional Interface
- **Dashboard** - Real-time statistics and activity feeds
- **Data Tables** - Advanced tables with sorting, filtering, pagination
- **Forms** - Comprehensive form validation and error handling
- **Modals** - Confirmation dialogs and form modals
- **Notifications** - Toast notifications for user feedback
- **Loading States** - Professional loading indicators

### Design System
- **Tailwind CSS** - Utility-first CSS framework
- **Custom Components** - Reusable UI component library
- **Responsive Design** - Mobile-first responsive layouts
- **Accessibility** - ARIA compliance and keyboard navigation
- **Theme Support** - Consistent color scheme and typography

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Comprehensive input sanitization
- **SQL Injection Protection** - Django ORM protection
- **XSS Protection** - React automatic escaping
- **CSRF Protection** - Django CSRF middleware

## 📈 Performance

- **Database Optimization** - Indexed queries and efficient relationships
- **API Pagination** - Efficient large dataset handling
- **Frontend Optimization** - Code splitting and lazy loading
- **Caching Strategy** - Redis caching for improved performance
- **Bundle Optimization** - Vite build optimization

## 🐳 Docker Support

The project includes comprehensive Docker support for both development and production:

### Development Features
- **Hot Reload** - Live code reloading for both frontend and backend
- **Volume Mounting** - Direct code editing without rebuilds
- **Service Isolation** - Separate containers for each service
- **Easy Setup** - One-command environment setup

### Production Features
- **Multi-stage Builds** - Optimized production images
- **Security Hardening** - Non-root users and security headers
- **Health Checks** - Automatic service health monitoring
- **Scaling Support** - Horizontal scaling capabilities
- **Backup Solutions** - Automated database backup and restore

See [README-Docker.md](README-Docker.md) for detailed Docker documentation.

## 🧪 Testing

```bash
# Backend tests
./scripts/docker-dev.sh test backend

# Frontend tests
./scripts/docker-dev.sh test frontend

# Manual API testing
# Visit http://localhost:8000/api/v1/ for API documentation
```

## 📚 API Documentation

The project includes comprehensive API documentation:

### Authentication Endpoints
- `POST /api/v1/auth/login/` - User login with JWT tokens
- `POST /api/v1/auth/refresh/` - Token refresh
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/logout/` - User logout

### CRM Entity Endpoints
- Full CRUD operations for all entities
- Advanced filtering and search capabilities
- Pagination support with metadata
- Related object name resolution

### Dashboard Endpoints
- `GET /api/v1/dashboard/stats/` - Real-time statistics
- `GET /api/v1/dashboard/activities/` - Recent activity feed

## 🔄 Development Workflow

1. **Make Changes** - Edit code in your preferred editor
2. **Hot Reload** - Changes are automatically reflected
3. **Run Tests** - Validate changes with test suite
4. **Commit Changes** - Use Git for version control
5. **Deploy** - Use Docker scripts for deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`./scripts/docker-dev.sh test backend`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📋 Requirements

### Development
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Manual Setup (Alternative)
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (optional, uses SQLite by default)
- Redis 7+ (optional, for production features)

## 🎯 Roadmap

### Phase 1: Core CRM ✅ **COMPLETED**
- [x] User authentication and management
- [x] Core CRM entities (Accounts, Contacts, Leads, Opportunities, Tasks)
- [x] Professional UI with data tables and forms
- [x] Docker deployment infrastructure
- [x] TypeScript integration and type safety

### Phase 2: Advanced Features (Planned)
- [ ] Email system integration
- [ ] Workflow automation
- [ ] Advanced reporting and analytics
- [ ] File management system
- [ ] Real-time notifications

### Phase 3: Enterprise Features (Future)
- [ ] Multi-tenant support
- [ ] Advanced customization engine
- [ ] Third-party integrations
- [ ] Mobile application
- [ ] Advanced security features

## 📝 License

This project is licensed under the AGPL-3.0-or-later license (same as EspoCRM for compatibility).

## 🆘 Support

For support, issues, or questions:
1. Check the [Docker documentation](README-Docker.md)
2. Review the [project context](PROJECT_CONTEXT.md)
3. Use the management scripts for troubleshooting
4. Open an issue on GitHub

## 🏆 Status

**Production-Ready** - This CRM system is fully functional and ready for production use with comprehensive Docker deployment support.