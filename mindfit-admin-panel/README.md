# MindFit Admin Panel

A comprehensive Angular 20 admin panel for managing MindFit fitness application data. Built with Angular Material components and TailwindCSS for a modern, responsive interface.

## Features

### Authentication
- JWT-based authentication using `/auth/admin/login` endpoint
- Protected routes with AuthGuard
- Automatic token refresh and logout on expiration
- User session management

### User Management
- Paginated user listing with sorting and filtering
- View, create, edit, and delete users
- User detail pages with tabbed interface showing:
  - Meals (paginated with nutritional information)
  - Exercises (paginated with duration and calories)
  - Measurements (paginated weight and height tracking)

### Logging System
- Paginated logs with advanced filtering (type, category, date range)
- Interactive chart showing logs per day
- Real-time log monitoring capabilities

### UI/UX Features
- Material Design components with TailwindCSS utilities
- Responsive layout that works on mobile and desktop
- Dark mode ready design
- Toast notifications for user feedback
- Confirmation dialogs for destructive actions
- Loading states and empty state handling

## Technology Stack

- **Angular 20** - Latest Angular with standalone components
- **Angular Material** - UI component library
- **TailwindCSS** - Utility-first CSS framework
- **Chart.js** - Data visualization for logs
- **RxJS** - Reactive programming patterns
- **TypeScript** - Type-safe development
- **OpenAPI** - Auto-generated API client

## Getting Started

### Prerequisites

- Node.js (18 or later)
- npm or yarn
- Running MindFit backend at `http://localhost:8080`

### Installation

1. Clone the repository and navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:4200`

### Environment Configuration

The application is configured to work with a local backend at `http://localhost:8080`. Update the environment files if your backend runs on a different URL:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

## API Client

The application uses auto-generated TypeScript clients from the OpenAPI specification.

### Regenerating API Client

When the backend API changes, regenerate the client:

```bash
npm run api:generate
```

This fetches the latest OpenAPI spec from `http://localhost:8080/api-docs` and generates TypeScript interfaces and services.

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run api:generate` - Regenerate API client from OpenAPI spec

## Project Structure

```
src/
├── app/
│   ├── api/                    # API services and models
│   ├── auth/                   # Authentication services and guards
│   ├── pages/                  # Page components
│   │   ├── login/             # Login page
│   │   ├── users/             # Users list page
│   │   ├── user-detail/       # User detail with tabs
│   │   └── logs/              # Logs page with chart
│   ├── shared/
│   │   ├── components/        # Reusable components
│   │   │   ├── data-table/    # Paginated table component
│   │   │   ├── navbar/        # Top navigation
│   │   │   └── confirm-dialog/ # Confirmation dialogs
│   │   └── services/          # Shared services (toast, dialog)
│   └── environments/          # Environment configurations
```

## Key Components

### DataTableComponent
Reusable paginated table with:
- Sorting and filtering
- Date range filters
- Search functionality
- Customizable columns and actions
- Loading states

### AuthService
Handles:
- JWT token management
- Login/logout functionality
- Token expiration checking
- User session state

### API Integration
All endpoints support:
- Pagination (page, size, sort)
- Date filtering (from, to)
- Search and filtering
- Proper error handling

## Authentication

The admin panel uses JWT authentication. Users must login with admin credentials to access the application. The token is stored in localStorage and automatically included in API requests.

### Default Login
Use your backend admin credentials to log in. The login form includes:
- Email validation
- Password strength requirements
- Loading states
- Error handling

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- RxJS patterns with async pipe
- Reactive forms with validation
- Material Design principles
- TailwindCSS utility classes

### Error Handling
- HTTP interceptor for global error handling
- User-friendly error messages
- Proper loading states
- Toast notifications for feedback

### Performance
- Lazy-loaded routes
- OnPush change detection where applicable
- Proper subscription management with takeUntil
- Optimized bundle with tree shaking

## API Endpoints

The application integrates with these main endpoints:

- `POST /auth/admin/login` - Admin authentication
- `GET /users` - List users (paginated)
- `GET /users/{id}` - Get user details
- `GET /users/{id}/meals` - Get user meals (paginated)
- `GET /users/{id}/exercises` - Get user exercises (paginated)  
- `GET /users/{id}/measurements` - Get user measurements (paginated)
- `GET /logs` - Get system logs (paginated)
- `GET /logs/stats` - Get log statistics for charts

All GET endpoints support pagination parameters:
- `page` - Page number (0-based)
- `size` - Page size (default: 20)
- `sort` - Sort field and direction (e.g., "timestamp,desc")
- `from` - Start date (ISO-8601)
- `to` - End date (ISO-8601)

## Development Server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Deployment

### Production Build
```bash
npm run build
```

The built application will be in the `dist/` directory and can be served by any static file server.

### Environment Variables
Update the production environment file with your production API URL before building.

## Contributing

1. Follow Angular style guide
2. Use conventional commit messages
3. Add unit tests for new features
4. Update documentation as needed

## License

This project is part of the MindFit fitness application suite.
