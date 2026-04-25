# Smart Waste Management System

An IoT-based garbage bin monitoring full-stack web application. 
This project is strategically structured to demonstrate **DevOps architectures, CI/CD pipelines, container orchestration, code quality analysis, and security scanning**.

## Project Ecosystem

- **Backend**: Node.js & Express.js (REST API, logic encapsulation, MongoDB connection).
- **Frontend**: React.js & Vite (Dashboard UI).
- **Database**: MongoDB (Orchestrated alongside the app).
- **DevOps**: Docker, Docker Compose, Jenkinsfile layout, SonarQube properties.

## Prerequisite Tools

- Docker & Docker Compose
- Node.js (If running locally instead of Dockerized)

## Running the Application (The DevOps Way)

The easiest and most compliant way to run the full stack is via Docker Compose.

```bash
# In the root directory (where docker-compose.yml lives)
docker compose up --build -d
```

### Access Points
- **Frontend Dashboard**: [http://localhost:80](http://localhost) (or just `localhost` depending on Docker setup)
- **Backend API Base**: [http://localhost:5000/api](http://localhost:5000/api)
- **DevOps Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

## DevOps Features for Academic Evaluation

### 1. Automated Testing (Jest/Supertest)
The backend contains a test suite. Run it locally:
```bash
cd backend
npm run test
```

### 2. Code Quality Integration
`sonar-project.properties` is prepared in the `backend/` folder to pipe results directly to an active SonarQube scanner instance during a CI step.

### 3. Deliberate Security Scanning Implementation
To prove that vulnerability scanning tools (like **Trivy** or **Snyk**) are effective in the pipeline, the backend project intentionally includes `lodash@4.17.15`, which has known prototype pollution vulnerabilities. A pipeline scan step will detect this and can be configured to fail or raise an alert.

### 4. Custom API Health Endpoint
The GET `/health` route is specifically implemented for monitoring systems to ping and establish database liveness readiness inside the CI/CD pipeline right after the deploy stage.

### 5. Multi-Container Orchestration
`docker-compose.yml` seamlessly spins up an internal MongoDB network, mounts the backend node application, and serves the static React build via Nginx.

## File Structure Highlights
- `/backend/Dockerfile` - Minimal footprint Alpine Node deployment.
- `/frontend/Dockerfile` - Multi-stage build producing static files served by Nginx.
- `/Jenkinsfile.example` - A fully fleshed-out Jenkins declarative pipeline representing Build, Test, Code Quality, SAST Security, Containerization, and Deploy blocks.
