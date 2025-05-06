# Architecture Documentation

## 1. Overview

L&D Nexus is a full-stack web application that connects Learning & Development professionals with companies. The platform enables professionals to showcase their expertise, while companies can post job opportunities and find suitable talent. The application follows a modern client-server architecture with a React frontend and Node.js backend.

## 2. System Architecture

The application follows a typical full-stack architecture with these main components:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js server using TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based authentication system with multiple roles (professional, company, admin)
- **File Storage**: Local file storage for uploads (portfolio projects, profiles)
- **API**: RESTful API endpoints organized by resource domains
- **External Services**: OpenAI for AI-powered matching and recommendations, Stripe for payments

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│             │      │             │      │             │
│   Client    │<────>│   Server    │<────>│  Database   │
│   (React)   │      │  (Express)  │      │ (PostgreSQL)│
│             │      │             │      │             │
└─────────────┘      └─────────────┘      └─────────────┘
                           ^
                           │
                           v
                    ┌─────────────┐
                    │  External   │
                    │  Services   │
                    │ (OpenAI,    │
                    │  Stripe)    │
                    └─────────────┘
```

## 3. Key Components

### 3.1 Frontend (`/client`)

- **Framework**: React with TypeScript
- **UI Components**: Uses Shadcn/UI component library (built on Radix UI primitives)
- **Routing**: Uses Wouter for lightweight routing
- **State Management**: React Query for server state, React Context for application state (Auth)
- **Form Handling**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS for utility-first styling
- **Key Pages**:
  - Public pages: Home, Login, Register, Professionals, Jobs
  - Professional dashboard and profile
  - Company dashboard and profile
  - Job posting and management
  - Resource sharing and management
  - Admin interface

### 3.2 Backend (`/server`)

- **Framework**: Express.js with TypeScript
- **API Routes**: RESTful endpoints organized by resource
- **Authentication**: JWT-based with session management
- **Security Middleware**: CSRF protection, Helmet for security headers
- **Database Access**: Drizzle ORM for type-safe database operations
- **Admin System**: Separate admin routes and authentication mechanism
- **AI Services**:
  - Job and professional matching algorithm
  - Career recommendations
  - Skill recommendations

### 3.3 Database Schema (`/shared/schema.ts`)

The application uses a PostgreSQL database with tables organized around these core entities:

- **Users**: Central authentication and user management
- **Professional Profiles**: For L&D professionals 
- **Company Profiles**: For hiring organizations
- **Expertise & Certifications**: For professional qualifications
- **Job Postings & Applications**: For work opportunities
- **Resources**: Learning materials shared by professionals
- **Forums & Messages**: For community interaction
- **Consultations & Reviews**: For service bookings and feedback
- **Admin Tables**: For platform management

### 3.4 Admin System (`/server/admin`)

- Separate authentication system
- Role-based access control (Founder > SuperAdmin > Admin > Moderator > Analyst)
- Admin dashboard for platform management
- Activity and action logging for accountability
- Specialized routes for administrative functions

## 4. Data Flow

### 4.1 Authentication Flow

1. User registers or logs in via `/api/auth` endpoints
2. Server validates credentials and issues JWT token
3. Frontend stores token in local storage
4. Subsequent requests include token in Authorization header
5. Protected routes verify token before processing
6. Social auth provides alternative login flows (Google, LinkedIn)

### 4.2 Job Matching Flow

1. Companies post jobs via the job creation form
2. Job details are stored in the database with vector embeddings (via OpenAI)
3. Professionals' skills and expertise are also stored with vector embeddings
4. Matching algorithm compares embeddings to find suitable matches
5. Results are presented to both professionals (matching jobs) and companies (matching professionals)

### 4.3 Resource Sharing Flow

1. Professionals create educational resources
2. Resources are categorized and stored in the database
3. Other users can discover resources via search or category browsing
4. Visibility controls determine who can access specific resources

### 4.4 Payment Processing Flow

1. User selects a subscription plan or service
2. Server creates a Stripe payment intent
3. Frontend presents Stripe Elements form
4. User submits payment details securely to Stripe
5. Stripe confirms payment and notifies the application
6. User's subscription or purchase is activated

## 5. External Dependencies

### 5.1 Major NPM Packages

- **Core**: React, Express, TypeScript
- **UI**: Radix UI components, Tailwind CSS, Lucide icons
- **State Management**: React Query, React Hook Form
- **Database**: Drizzle ORM, NeonDB serverless connector
- **Validation**: Zod schema validation
- **Authentication**: Passport.js, JWT
- **Payment Processing**: Stripe

### 5.2 External Services

- **OpenAI API**: For generating embeddings and recommendations
- **Stripe**: For payment processing and subscription management
- **SendGrid**: For email notifications (password reset, etc.)
- **Social Auth Providers**: Google and LinkedIn OAuth

## 6. Deployment Strategy

The application is configured for deployment on Replit with the following characteristics:

- **Build Process**: Vite for frontend bundling, esbuild for server compilation
- **Runtime Environment**: Node.js 20
- **Database**: PostgreSQL 16 (NeonDB)
- **Ports Configuration**:
  - Port 5000 for server (mapped to 80 externally)
  - Port 5001 for development (mapped to 3000 externally)
- **Environment Variables**: DATABASE_URL, OPENAI_API_KEY, STRIPE_SECRET_KEY, etc.
- **Static Assets**: Served from `/server/public` directory

### 6.1 Development Workflow

1. Local development using `npm run dev`
2. Database migrations with Drizzle Kit
3. Type checking with TypeScript
4. Production build created with Vite and esbuild
5. Production server runs from `/dist` directory

## 7. Security Considerations

- **CSRF Protection**: Implemented with csurf middleware
- **Content Security Policy**: Configured via Helmet
- **Input Validation**: Using Zod schemas on both client and server
- **Password Security**: Bcrypt for password hashing
- **Rate Limiting**: Implemented for sensitive endpoints (especially admin)
- **Error Handling**: Structured error responses without sensitive information
- **Admin Access Control**: Fine-grained permissions and activity logging

## 8. Future Architectural Considerations

- **Scalability**: Current architecture is suitable for moderate traffic
- **Caching**: Could introduce Redis for improved performance
- **Microservices**: Potential to split into microservices as the platform grows
- **Webhooks**: Planned for integrations with learning management systems
- **Analytics**: Data pipeline for business intelligence and platform optimization