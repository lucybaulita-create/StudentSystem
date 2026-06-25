# PostgreSQL Users Database Setup

## Overview
A new PostgreSQL database (`users_db`) has been created to store user information only. This is separate from the main SQLite student system database.

## Database Credentials

- **Database Name**: `users_db`
- **Database User**: `users_user`
- **Database Password**: `users_password`
- **Host**: `users-postgres` (in Docker) or `localhost` (local development)
- **Port**: `5432`

## Connection String

For Docker environment:
```
postgresql://users_user:users_password@users-postgres:5432/users_db
```

For local development:
```
postgresql://users_user:users_password@localhost:5432/users_db
```

## Users Table Schema

The `users` table contains the following fields:

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user identifier |
| first_name | VARCHAR(255) | NOT NULL | User's first name |
| last_name | VARCHAR(255) | NOT NULL | User's last name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User's email (unique) |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| role | VARCHAR(50) | DEFAULT 'student' | User role (student, admin, registrar) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

## Indexes

The following indexes have been created for performance optimization:

- `idx_users_email` on `email` column
- `idx_users_role` on `role` column
- `idx_users_is_verified` on `is_verified` column

## Docker Setup

The PostgreSQL service is now configured in `docker-compose.yml`:

```yaml
postgres:
  image: postgres:15-alpine
  container_name: users-postgres
  ports:
    - "5432:5432"
  environment:
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}
  volumes:
    - ./backend/users_table.sql:/docker-entrypoint-initdb.d/01-users_table.sql
    - postgres-storage:/var/lib/postgresql/data
```

The database is automatically initialized with the `users_table.sql` script.

## Python Integration

### Using the Users Database

In your Python backend code, use the `users_db.py` module:

```python
from users_db import get_users_db, User, UsersSessionLocal

# Using dependency injection in FastAPI
from fastapi import Depends

@app.post("/users")
def create_user(user_data: dict, db = Depends(get_users_db)):
    new_user = User(
        first_name=user_data['first_name'],
        last_name=user_data['last_name'],
        email=user_data['email'],
        password=user_data['password'],
        role=user_data.get('role', 'student')
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
```

### Database Models

The `User` model is defined in `users_db.py` with all necessary ORM mappings.

## Running the System

1. **Start Docker containers**:
   ```bash
   docker-compose up -d
   ```

2. **Verify PostgreSQL is running**:
   ```bash
   docker exec users-postgres pg_isready -U postgres
   ```

3. **Connect to the database** (optional):
   ```bash
   docker exec -it users-postgres psql -U postgres -d users_db
   ```

4. **View users table**:
   ```sql
   \dt  -- List all tables
   SELECT * FROM users;  -- View all users
   ```

## Environment Variables

Add to your `.env` file or docker environment:

```
USERS_DATABASE_URL=postgresql://users_user:users_password@users-postgres:5432/users_db
POSTGRES_PASSWORD=your_secure_password
```

## Notes

- The backend service now depends on the PostgreSQL service and will wait for it to be healthy before starting
- The `users_table.sql` script is automatically executed during PostgreSQL container initialization
- Both the SQLite database (existing student system) and PostgreSQL users database can coexist and are independent
- The environment variable `USERS_DATABASE_URL` is available in the backend service for connecting to the users database

## Troubleshooting

### PostgreSQL won't start
```bash
docker logs users-postgres
```

### Connect manually to verify
```bash
psql postgresql://users_user:users_password@localhost:5432/users_db
```

### Reset the database
```bash
docker-compose down -v  # Remove volumes
docker-compose up -d    # Restart fresh
```
