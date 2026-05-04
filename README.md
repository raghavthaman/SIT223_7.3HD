# Smart Waste Management System (Top HD)

**Live Deployment:** [https://sit-223-7-3-hd.vercel.app/](https://sit-223-7-3-hd.vercel.app/) *(Frontend deployed via Vercel, Backend deployed via Render)*

An IoT-based garbage bin monitoring full-stack web application. 
This project is strategically structured to demonstrate **DevOps architectures, CI/CD pipelines, container orchestration, code quality analysis, real-time monitoring, and security scanning**.

## Project Ecosystem

- **Backend**: Node.js & Express.js (REST API, logic encapsulation, MongoDB connection, Socket.IO).
- **Frontend**: React.js & Vite (Real-time Dashboard UI via Leaflet & Tailwind).
- **Database**: MongoDB (Orchestrated alongside the app).
- **DevOps**: Docker, Docker Compose, Jenkins, SonarCloud, Trivy.
- **Monitoring**: Prometheus, Grafana, Alertmanager.

## Prerequisite Tools

- Docker & Docker Compose
- Jenkins (for running the CI/CD pipeline)

## Running the Application

The easiest and most compliant way to run the full stack is via Docker Compose.

```bash
# In the root directory (where docker-compose.yml lives)
docker compose up --build -d
```

### Access Points
- **Frontend Dashboard**: [http://localhost:80](http://localhost)
- **Backend API Base**: [http://localhost:5000/api](http://localhost:5000/api)
- **DevOps Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Grafana (Monitoring Dashboard)**: [http://localhost:3000](http://localhost:3000) (Credentials: `admin / admin`)
- **Prometheus (Metrics & Alerts)**: [http://localhost:9090](http://localhost:9090)

## Running the Jenkins Pipeline

1. Ensure your Jenkins server has the following plugins and tools installed: Docker, SonarQube Scanner, Trivy.
2. Ensure you have configured the necessary credentials: `dockerhub-credentials` and `sonarcloud-token`.
3. Create a new Pipeline job in Jenkins.
4. Point the Pipeline definition to "Pipeline script from SCM" and link this repository, ensuring the script path is `Jenkinsfile`.
5. Click **Build Now**. The pipeline will execute Checkout -> Build -> Test -> Code Quality -> Security -> Deploy -> Release -> Monitoring.

## Release Traceability

Our pipeline ensures absolute traceability of versions through a synchronized tagging mechanism:

1. **Version Generation**: The version is dynamically generated during the pipeline initialization using the Jenkins environment variable `BUILD_NUMBER`. The format is strictly `v1.0.{BUILD_NUMBER}`.
2. **Build Stage**: This exact version tag is applied to the newly built Docker images (`smart-waste-backend` and `smart-waste-frontend`).
3. **Release Stage**: 
   - A `release-manifest.txt` is generated capturing the exact image tags deployed for auditing purposes.
   - The versioned images are pushed securely to the DockerHub registry.
   - A Git tag of the identical version is created and pushed to the repository.
   
This guarantees that the exact code in the repository matches the exact Docker image built, which matches the exact application running in production.

## Rollback Procedure

The Jenkins pipeline inherently handles failure rollbacks during the Deploy stage. However, if a manual rollback is required due to an incident:

1. Stop the currently running infrastructure:
   ```bash
   docker compose down
   ```
2. Manually pull the known-stable previous version tags from DockerHub (or simply rely on `latest` if it points to a stable build):
   ```bash
   docker pull [YOUR_DOCKER_USER]/smart-waste-backend:<PREVIOUS_VERSION_TAG>
   docker pull [YOUR_DOCKER_USER]/smart-waste-frontend:<PREVIOUS_VERSION_TAG>
   ```
   *(Update your `docker-compose.yml` image tags temporarily if pulling specific historic versions).*
3. Restart the stack:
   ```bash
   docker compose up -d
   ```
4. Verify the frontend and health check endpoints to confirm the rollback was successful.

## DevOps Features for Academic Evaluation

- **Quality Gated (SonarCloud)**: The pipeline actively halts if quality metrics fail.
- **Security Gated (Trivy)**: The pipeline actively halts if HIGH or CRITICAL vulnerabilities are found.
- **Real-Time Integration (Observability)**: Prometheus actively scrapes the backend. If the backend fails, Alertmanager fires, demonstrating a continuous CI/CD-to-Monitoring feedback loop.
