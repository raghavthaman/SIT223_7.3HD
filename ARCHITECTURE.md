# System Architecture

The Smart Waste Management System is designed as a robust, production-grade IoMT (Internet of Medical/Mechanical Things) platform, leveraging a modern MERN stack coupled with a comprehensive DevOps lifecycle and observability suite.

## Core Application Stack
- **Frontend**: React.js mapped via Leaflet and styled with TailwindCSS. Communicates dynamically via `socket.io-client`.
- **Backend**: Node.js & Express.js. Powers REST endpoints and maintains persistent `Socket.IO` channels for real-time telemetry updates.
- **Database**: MongoDB handles persistent storage of sensors, users, and routing coordinates.

## CI/CD Pipeline (Jenkins)
The deployment lifecycle is orchestrated through a strict, multi-stage Jenkins pipeline:
1. **Test**: Runs automated Jest/Supertest coverage.
2. **Quality Gate**: SonarCloud performs static code analysis. The pipeline strictly blocks (`abortPipeline: true`) if the quality gate fails.
3. **Security**: Trivy scans the filesystem for vulnerabilities (configured strictly to `--exit-code 1` on `HIGH,CRITICAL` severity).
4. **Deploy**: Deploys the infrastructure using `docker-compose`. Built-in rollback functionality reverts the containers if healthchecks fail post-deployment.
5. **Release**: Assets are strictly tagged (`v1.0.{BUILD_NUMBER}`) and pushed to DockerHub alongside a `release-manifest.txt` for absolute traceability.

## Monitoring Stack Integration

Our observability is powered by the Prometheus ecosystem:
- **Backend Instrumentation**: The Node.js server utilizes `prom-client` to expose CPU/Memory metrics and an HTTP request latency histogram at the `/metrics` endpoint.
- **Prometheus**: Scrapes `/metrics` every 5 seconds. It evaluates pre-configured alerting rules (e.g., `BackendDown` and `HighLatency`).
- **Alertmanager**: Intercepts `FIRING` alerts from Prometheus to route notifications to developers.
- **Grafana**: Visualizes the Prometheus time-series data via auto-provisioned dashboards.

### CI/CD ↔ Monitoring Integration
This architecture ensures that **Jenkins deploys via Docker Compose**, while the **Backend exposes /metrics**, allowing **Prometheus to scrape metrics**, **Alertmanager to trigger alerts**, and **Grafana to visualize system state**. 

This creates a continuous, automated feedback loop between deployment and monitoring, ensuring any degradation introduced by the CI/CD pipeline is instantly identified and alerted upon in the production state.
