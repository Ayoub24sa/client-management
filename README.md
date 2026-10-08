# Client Management

A full-stack web application for managing clients.

## Features

* User registration and login
* Secure authentication with JWT
* Create, view, edit and delete clients
* Search clients
* Filter clients by status
* Client details
* Dashboard with statistics
* Form validation
* Responsive and clean interface

## Technologies

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express.js
* Prisma ORM
* SQLite
* JWT
* bcrypt

## Project Structure

```text
client-management/
├── frontend/
└── backend/
```

## Installation

### Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
```

Then run:

```bash
npx prisma generate
npx prisma migrate dev
node server.js
```

The backend runs on:

```text
http://localhost:5000
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5174
```

## Authentication

The application uses JWT authentication. Protected client-management routes require a valid authentication token.

## Database

The project uses Prisma ORM with SQLite for local development.
