# Event Management API

A RESTful API for managing events and participants, built with Node.js, Express, and Sequelize.

## Features

- User registration and authentication (JWT)
- Role-based access control (admin and user roles)
- Event CRUD operations (create, read, update, delete)
- Participant subscription management
- PostgreSQL database with Sequelize ORM

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (with SQLite support for development)
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **CORS**: cors middleware

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd event-management-api
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
Create a `.env` file in the root directory with the following variables:

```env
DB_NAME=event_management
DB_USER=postgres
DB_PASS=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| GET | `/api/auth/users` | Get all users (admin only) | Yes (Admin) |

### Events

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events` | Get all events | No |
| GET | `/api/events/:id` | Get event by ID | No |
| POST | `/api/events` | Create a new event | Yes (Admin) |
| PUT | `/api/events/:id` | Update an event | Yes (Admin) |
| DELETE | `/api/events/:id` | Delete an event | Yes (Admin) |

### Participants

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/events/:id/participants` | Get event participants | Yes |
| POST | `/api/events/:id/participants` | Subscribe to an event | Yes |
| DELETE | `/api/events/:id/participants/me` | Cancel subscription | Yes |

## Default Admin Account

After the first server start, a default admin account is created:

- **Email**: admin@admin.com
- **Password**: adminpassword

## Project Structure

```
event-management-api/
├── index.js                 # Application entry point
├── package.json             # Dependencies and scripts
├── common/
│   ├── database.js          # Sequelize configuration
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventsController.js
│   │   └── participantController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── adminMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Event.js
│   │   └── participant.js
│   └── routes/
│       ├── authRoutes.js
│       └── eventRoutes.js
└── middlewares/             # Additional middleware directory
```

## License

MIT