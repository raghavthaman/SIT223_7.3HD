# System Demonstration Guide (Top HD)

This guide provides a step-by-step walkthrough to demonstrate the production-grade CI/CD and monitoring capabilities of the Smart Waste Management System.

## Part 1: CI/CD Pipeline (Jenkins)

1. **Trigger a Build**: Show Jenkins pulling the latest commit.
2. **Quality Gate Validation**: Show the `Code Quality` and `Quality Gate` stages. Point out the `waitForQualityGate abortPipeline: true` logic, proving that SonarCloud actively gates the deployment.
3. **Security Validation**: Show the `Security` stage. Emphasize that Trivy is scanning with `--severity HIGH,CRITICAL --exit-code 1`. Mention how `lodash` was upgraded to pass this gate.
4. **Release Traceability**: Show the `Release` stage. Highlight the generated `release-manifest.txt` and the `v1.0.{BUILD_NUMBER}` versioning scheme syncing Docker tags and Git tags.

## Part 2: Real-time Application

1. Open the **Frontend Dashboard** (http://localhost:80).
2. Show the real-time UI mapping powered by Socket.IO.
3. Emphasize that NO HTTP polling is occurring (verify by opening the browser network tab to show zero continuous XHR requests, only a persistent WebSocket connection).

## Part 3: Incident Simulation & Monitoring Feedback Loop (MANDATORY)

This section demonstrates the CI/CD ↔ Monitoring integration.

### Preparation
1. Ensure the stack is running: `docker compose up -d`
2. Open **Grafana Dashboard** (http://localhost:3000) using credentials `admin / admin`.
3. Navigate to the `Smart Waste Observability` dashboard.
4. Point out the live metrics: CPU, Memory, Request Rate, and Uptime (100%).

### The Simulation
1. **Trigger Downtime**: In your terminal, intentionally crash the backend container:
   ```bash
   docker stop smart-waste-backend
   ```
2. **Observe Prometheus**: Open Prometheus (http://localhost:9090/alerts). Show that the `BackendDown` rule enters a `PENDING` state, then flips to `FIRING` after 10 seconds.
3. **Observe Alertmanager**: (Optional) Show Alertmanager intercepting the alert routing.
4. **Observe Grafana**: Switch back to the Grafana dashboard. Show the Uptime panel dropping to 0 (or showing offline), and request rates flatlining. This creates a continuous feedback loop between deployment and monitoring.

### The Recovery
1. **Restore Service**: Restart the backend container:
   ```bash
   docker start smart-waste-backend
   ```
2. **Verify Recovery**: Show Prometheus alerts returning to green and Grafana metrics resuming their live plotting.
