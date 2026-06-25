# StudentSystem Backend with Prometheus & Grafana Monitoring

## Setup Instructions

### 1. Install Docker & Docker Compose
Make sure Docker and Docker Compose are installed on your system.

### 2. Start All Services with Docker

From the project root:

```bash
docker-compose up -d
```

This will start:
- **Backend**: `http://localhost:8000`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001` (login: admin/admin)

### Verify Services

- Backend health: `http://localhost:8000/`
- Metrics endpoint: `http://localhost:8000/metrics`
- Prometheus scrape targets: `http://localhost:9090/targets`

### Stop All Services

```bash
docker-compose down
```

## API Endpoints

### Authentication
- **POST /signup** - Register a new user
  - Request: `{ first_name, last_name, email, password }`
  - Response: Verification code sent to email
  
- **POST /verify-email** - Verify email with code
  - Request: `{ email, code }`
  - Response: Email verified successfully
  
- **POST /resend-verification-code** - Resend verification code
  - Request: `{ email }`
  - Response: Code sent to email
  
- **POST /login** - Login user
  - Request: `{ email, password }`
  - Response: User details if verified

## User Registration Flow

1. User signs up with first name, last name, email, and password
2. Backend creates user account and sends 6-digit verification code to email
3. User redirected to email verification page
4. User enters the code from email
5. Backend verifies the code
6. User can now log in

## Monitoring Metrics

The backend exposes these Prometheus metrics:

- **http_request_duration_seconds** - HTTP request latency
- **http_requests_total** - Total HTTP requests by method, endpoint, status
- **students_total** - Current number of students
- **student_operations_total** - Total student operations (create, read, update, delete) by status

## Setting Up Grafana Dashboard

1. Open Grafana: `http://localhost:3001`
2. Login with `admin` / `admin`
3. Add Prometheus data source:
   - Click: **Configuration → Data Sources → Add Data Source**
   - Select: **Prometheus**
   - URL: `http://prometheus:9090`
   - Click: **Save & Test**

4. Create a Dashboard:
   - Click: **Create → Dashboard**
   - Click: **Add Panel**
   - Use these queries:

**Example Queries:**
- `rate(http_requests_total[5m])` - Request rate
- `histogram_quantile(0.95, http_request_duration_seconds)` - 95% latency
- `students_total` - Total students
- `rate(student_operations_total[5m])` - Operation rate

## Stop Services
```bash
docker-compose down
```

## Clean Up Volumes
```bash
docker-compose down -v
```
