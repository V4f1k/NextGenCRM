# NextGenCRM

A modern, full-featured CRM system built with Django REST Framework and React TypeScript, designed as a complete replacement for EspoCRM with enhanced performance and maintainability.

## Architecture

- **Backend**: Django REST Framework (Python 3.11+)
- **Database**: PostgreSQL with Redis caching
- **Frontend**: React 18 + TypeScript + Vite
- **API**: REST + GraphQL hybrid
- **Real-time**: WebSocket support via Django Channels
- **Authentication**: JWT with refresh tokens

## Project Structure

```
NextGenCRM/
├── backend/          # Django REST API
├── frontend/         # React TypeScript SPA  
├── shared/           # Shared types/utilities
├── docker/           # Docker configuration
├── docs/             # API documentation
└── tests/            # E2E tests
```

## Key Features

- **Complete CRM Suite**: 23+ entity types (Account, Contact, Lead, Opportunity, etc.)
- **Email Integration**: Full email client with templates and automation
- **Advanced ACL**: Role-based permissions with field-level control
- **Customization Engine**: Custom fields, entities, layouts, and workflows
- **Portal System**: External user access with restricted permissions
- **Real-time Updates**: WebSocket notifications and live collaboration
- **Multi-language Support**: i18n with dynamic translations

## Quick Start

### Development Setup

```bash
# Start backend
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Start frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Production Setup

```bash
docker-compose up -d
```

## Development Status

🚧 **In Development** - This project is currently being developed as a complete EspoCRM replacement.

## License

AGPL-3.0-or-later (same as EspoCRM for compatibility)