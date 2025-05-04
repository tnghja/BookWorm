# BookWorm

BookWorm is a full-stack web application for book lovers to discover, track, and review books.

## Project Overview

This project consists of:
- Backend: FastAPI-based API server with SQLAlchemy ORM
- Frontend: React application with modern UI built using Vite, React 19, and Tailwind CSS

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy & SQLModel
- Alembic for database migrations
- Pydantic for data validation
- PostgreSQL database
- JWT authentication

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Zustand for state management
- React Query for data fetching
- Zod for schema validation
- shadcn/ui components

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup
1. Navigate to the app directory:
   ```
   cd app
   ```

2. Create a virtual environment:
   ```
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirement.txt
   ```

4. Set up environment variables (create a .env file based on example)

5. Initialize the database:
   ```
   python initial_db.py
   ```

6. Run the server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd front-end
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

```
├── app/                  # Backend application
│   ├── api/              # API endpoints
│   ├── core/             # Core application settings
│   ├── db/               # Database configuration
│   ├── model/            # SQLAlchemy models
│   ├── schema/           # Pydantic schemas
│   ├── repository/       # Database operations
│   ├── service/          # Business logic
│   └── util/             # Utility functions
├── front-end/            # Frontend application
│   ├── public/           # Static assets
│   └── src/              # React application source
├── tests/                # Test suite
└── README.md             # This file
```

## License

[MIT License](LICENSE) 
