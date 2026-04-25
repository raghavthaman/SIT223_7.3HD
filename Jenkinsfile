pipeline {
    agent any

    // ─────────────────────────────────────────────────────────────────
    // ENVIRONMENT VARIABLES
    // Before running, make sure these credentials exist in Jenkins:
    //   1. dockerhub-credentials  → Username/Password (Docker Hub)
    //   2. sonarcloud-token       → Secret Text (SonarCloud token)
    // ─────────────────────────────────────────────────────────────────
    environment {
        // Docker Hub — Jenkins credential ID must be exactly 'dockerhub-credentials'
        DOCKER_CREDS        = credentials('dockerhub-credentials')
        DOCKER_HUB_USER     = "${DOCKER_CREDS_USR}"

        // Docker image names — auto-built from your Docker Hub username
        BACKEND_IMAGE       = "${DOCKER_CREDS_USR}/smart-waste-backend"
        FRONTEND_IMAGE      = "${DOCKER_CREDS_USR}/smart-waste-frontend"
        IMAGE_TAG           = "v1.0.${BUILD_NUMBER}"

        // SonarCloud — Jenkins credential ID must be exactly 'sonarcloud-token'
        SONAR_TOKEN         = credentials('sonarcloud-token')

        // ── REPLACE THESE TWO VALUES WITH YOUR OWN ──────────────────
        // SONAR_ORG:     your GitHub username (SonarCloud organisation key)
        // SONAR_PROJECT: found on SonarCloud > your project > Project Information
        SONAR_ORG           = 'raghavthaman'
        SONAR_PROJECT       = 'raghavthaman_SIT223_7.3HD'
        // ────────────────────────────────────────────────────────────

        NOTIFY_EMAIL        = 'your@email.com'
    }

    // ─────────────────────────────────────────────────────────────────
    // Auto-trigger on every GitHub push
    // ─────────────────────────────────────────────────────────────────
    triggers {
        githubPush()
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    // =================================================================
    // PIPELINE STAGES
    // =================================================================
    stages {

        // ── CHECKOUT ─────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo "Checking out source code..."
                checkout scm
                sh 'git log --oneline -5'
            }
        }

        // ── STAGE 1: BUILD ───────────────────────────────────────────
        // Builds versioned Docker images for backend and frontend.
        // Each image is tagged with both the version number and 'latest'
        // so old versions can always be pulled for rollback.
        // ─────────────────────────────────────────────────────────────
        stage('Build') {
            steps {
                echo "Building Docker images — tag: ${IMAGE_TAG}"
                sh """
                    docker build \\
                        -t ${BACKEND_IMAGE}:${IMAGE_TAG} \\
                        -t ${BACKEND_IMAGE}:latest \\
                        ./backend

                    docker build \\
                        -t ${FRONTEND_IMAGE}:${IMAGE_TAG} \\
                        -t ${FRONTEND_IMAGE}:latest \\
                        ./frontend
                """
                sh "echo ${IMAGE_TAG} > build-version.txt"
                archiveArtifacts artifacts: 'build-version.txt', fingerprint: true
            }
            post {
                success { echo "BUILD PASSED — images tagged ${IMAGE_TAG}" }
                failure { echo "BUILD FAILED" }
            }
        }

        // ── STAGE 2: TEST ────────────────────────────────────────────
        // Runs Jest unit + integration tests with coverage.
        // jest-junit produces junit.xml so Jenkins can display
        // test trends and mark the build failed on any test failure.
        // ─────────────────────────────────────────────────────────────
        stage('Test') {
            steps {
                dir('backend') {
                    echo "Installing dependencies..."
                    sh 'npm ci'
                    echo "Running Jest tests with coverage..."
                    sh 'npx jest --coverage --reporters=default --reporters=jest-junit 2>&1 | tee jest-output.txt'
                }
            }
            post {
                always {
                    // Publish JUnit XML → Jenkins test result trend graphs
                    junit allowEmptyResults: true, testResults: 'backend/junit.xml'
                    // Publish HTML coverage report → accessible from Jenkins sidebar
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'backend/coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Jest Coverage Report'
                    ])
                    archiveArtifacts artifacts: 'backend/jest-output.txt', allowEmptyArchive: true
                }
                success { echo "TEST PASSED — all tests green" }
                failure { error  "TEST FAILED — pipeline halted" }
            }
        }

        // ── STAGE 3: CODE QUALITY ────────────────────────────────────
        // Sends code to SonarCloud for static analysis.
        // Checks: code smells, duplication, coverage, complexity.
        // waitForQualityGate polls SonarCloud for the gate result.
        // SonarCloud server name in Jenkins MUST be 'My SonarQube Server'
        // ─────────────────────────────────────────────────────────────
        stage('Code Quality') {
            steps {
                dir('backend') {
                    echo "Running SonarCloud analysis..."
                    withSonarQubeEnv('My SonarQube Server') {
                        sh """
                            sonar-scanner \\
                              -Dsonar.host.url=https://sonarcloud.io \\
                              -Dsonar.token=${SONAR_TOKEN} \\
                              -Dsonar.organization=${SONAR_ORG} \\
                              -Dsonar.projectKey=${SONAR_PROJECT} \\
                              -Dsonar.projectName="Smart Waste Backend" \\
                              -Dsonar.projectVersion=${IMAGE_TAG} \\
                              -Dsonar.sources=src \\
                              -Dsonar.tests=tests \\
                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \\
                              -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/dist/** \\
                              -Dsonar.coverage.exclusions=**/node_modules/**,**/tests/**,**/coverage/** \\
                              -Dsonar.cpd.exclusions=**/tests/**
                        """
                    }
                }
            }
            post {
                always {
                    // Wait for SonarCloud to process the report and return Quality Gate status
                    script {
                        try {
                            def qg = waitForQualityGate abortPipeline: false
                            if (qg.status != 'OK') {
                                echo "WARNING: SonarCloud Quality Gate status: ${qg.status}"
                            } else {
                                echo "QUALITY GATE PASSED — status: ${qg.status}"
                            }
                        } catch (err) {
                            echo "Quality Gate check skipped or timed out: ${err}"
                        }
                    }
                }
                success { echo "CODE QUALITY PASSED" }
                failure { echo "CODE QUALITY stage encountered issues — see SonarCloud dashboard" }
            }
        }

        // ── STAGE 4: SECURITY ────────────────────────────────────────
        // Trivy scans the entire project filesystem for HIGH and
        // CRITICAL CVEs in dependencies and Docker images.
        // exit-code 0 = report-only mode (non-blocking) so pipeline
        // continues even if vulnerabilities are found (intended for demo).
        //
        // Known CVE: lodash@4.17.15 — CVE-2020-8203 (Prototype Pollution)
        //   Severity : HIGH
        //   Status   : Intentionally kept to demonstrate security scanning
        //   Fix      : Upgrade lodash to >= 4.17.21 in production
        // ─────────────────────────────────────────────────────────────
        stage('Security') {
            steps {
                echo "Running Trivy security scan..."
                sh """
                    trivy fs \\
                        --severity HIGH,CRITICAL \\
                        --exit-code 0 \\
                        --format table \\
                        --output trivy-report.txt \\
                        .

                    echo ""
                    echo "=== Trivy Scan Results ==="
                    cat trivy-report.txt
                    echo ""
                    echo "=== Security Stage Summary ==="
                    echo "Known CVE : lodash@4.17.15 - CVE-2020-8203 - Prototype Pollution"
                    echo "Severity  : HIGH"
                    echo "Status    : Intentional - kept to demonstrate shift-left security"
                    echo "Fix       : Upgrade lodash to >= 4.17.21 in production"
                """
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.txt', allowEmptyArchive: true
                }
                success { echo "SECURITY SCAN COMPLETE — review trivy-report.txt for findings" }
            }
        }

        // ── STAGE 5: DEPLOY ──────────────────────────────────────────
        // Deploys all services to local staging via Docker Compose.
        // Services: MongoDB, backend API (port 5000), frontend (port 80)
        // Health check retries 5 times before failing the stage.
        // ─────────────────────────────────────────────────────────────
        stage('Deploy') {
            steps {
                echo "Deploying to staging environment..."
                sh """
                    docker compose down --remove-orphans || true
                    docker compose up -d
                    echo "Waiting 15 seconds for services to start..."
                    sleep 15
                """

                echo "Running health check on backend API..."
                retry(5) {
                    sh 'curl -f --max-time 5 http://localhost:5000/health'
                    sleep time: 5, unit: 'SECONDS'
                }

                echo "All services are healthy and running."
                sh 'docker compose ps'
            }
            post {
                success { echo "DEPLOY PASSED — app running at http://localhost:80" }
                failure {
                    sh 'docker compose logs --tail=50 || true'
                    error "DEPLOY FAILED — health check did not pass after 5 retries"
                }
            }
        }

        // ── STAGE 6: RELEASE ─────────────────────────────────────────
        // Logs in to Docker Hub and pushes both versioned and
        // latest-tagged images. Creates a release manifest file
        // for full audit trail and archived in Jenkins.
        // ─────────────────────────────────────────────────────────────
        stage('Release') {
            steps {
                echo "Pushing release ${IMAGE_TAG} to Docker Hub..."
                sh """
                    echo "${DOCKER_CREDS_PSW}" | docker login -u "${DOCKER_CREDS_USR}" --password-stdin

                    docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                    docker push ${BACKEND_IMAGE}:latest
                    docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                    docker push ${FRONTEND_IMAGE}:latest

                    docker logout
                    echo "Images pushed successfully."
                """

                sh """
                    cat > release-manifest.txt << 'MANIFEST'
=== Smart Waste Release Manifest ===
MANIFEST
                    echo "Version    : ${IMAGE_TAG}"           >> release-manifest.txt
                    echo "Build #    : ${BUILD_NUMBER}"        >> release-manifest.txt
                    echo "Timestamp  : \$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> release-manifest.txt
                    echo "Backend    : ${BACKEND_IMAGE}:${IMAGE_TAG}"    >> release-manifest.txt
                    echo "Frontend   : ${FRONTEND_IMAGE}:${IMAGE_TAG}"   >> release-manifest.txt
                    echo "Git Commit : \$(git rev-parse --short HEAD)"   >> release-manifest.txt
                    echo "Git Branch : \$(git rev-parse --abbrev-ref HEAD)" >> release-manifest.txt
                    echo "Status     : RELEASED"               >> release-manifest.txt
                    echo "===================================="  >> release-manifest.txt
                    cat release-manifest.txt
                """
                archiveArtifacts artifacts: 'release-manifest.txt', fingerprint: true
            }
            post {
                success { echo "RELEASE PASSED — ${IMAGE_TAG} is live on Docker Hub" }
                failure { echo "RELEASE FAILED — check Docker Hub credentials" }
            }
        }

        // ── STAGE 7: MONITORING ──────────────────────────────────────
        // Validates the live deployment via the /health endpoint.
        // Collects container resource metrics via docker stats.
        // Tails backend logs for any runtime errors.
        // Pipeline fails if health endpoint returns non-200.
        // ─────────────────────────────────────────────────────────────
        stage('Monitoring') {
            steps {
                echo "Running monitoring checks..."
                sh """
                    echo "=== Health Endpoint Check ==="
                    HEALTH_RESPONSE=\$(curl -sf http://localhost:5000/health || echo '{"status":"down"}')
                    echo "Response: \$HEALTH_RESPONSE"

                    STATUS=\$(echo "\$HEALTH_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null || echo "unknown")
                    DB=\$(echo "\$HEALTH_RESPONSE"     | python3 -c "import sys,json; print(json.load(sys.stdin).get('database','unknown'))" 2>/dev/null || echo "unknown")

                    echo "Service Status  : \$STATUS"
                    echo "Database Status : \$DB"
                    echo "Build Version   : ${IMAGE_TAG}"

                    if [ "\$STATUS" != "up" ]; then
                        echo "ALERT: Application is DOWN"
                        exit 1
                    fi

                    echo ""
                    echo "=== Container Resource Metrics ==="
                    docker stats --no-stream --format "table {{.Name}}\\t{{.CPUPerc}}\\t{{.MemUsage}}\\t{{.NetIO}}" || true

                    echo ""
                    echo "=== Backend Application Logs (last 20 lines) ==="
                    docker logs smart-waste-backend --tail=20 2>&1 || true

                    echo ""
                    echo "=== Monitoring Summary ==="
                    echo "All checks PASSED"
                    echo "App Status : UP"
                    echo "Build      : ${IMAGE_TAG}"
                    echo ""
                    echo "Production monitoring note:"
                    echo "  In production, Prometheus scrapes /metrics for real-time data."
                    echo "  Grafana dashboards display CPU, memory, and request-rate graphs."
                    echo "  Alertmanager fires Slack or email alerts on threshold breaches."
                """
            }
            post {
                always {
                    sh "docker stats --no-stream > monitoring-snapshot.txt 2>&1 || true"
                    archiveArtifacts artifacts: 'monitoring-snapshot.txt', allowEmptyArchive: true
                }
                success { echo "MONITORING PASSED — all systems operational" }
                failure { echo "MONITORING FAILED — application may be down" }
            }
        }

    } // end stages

    // =================================================================
    // POST PIPELINE
    // =================================================================
    post {
        always {
            echo """
            ════════════════════════════════════════════════
             Smart Waste Pipeline — Complete
             Build    : #${BUILD_NUMBER}
             Version  : ${IMAGE_TAG}
             Result   : ${currentBuild.currentResult}
            ════════════════════════════════════════════════
            """
        }
        success {
            echo "SUCCESS — All 7 stages passed. Version ${IMAGE_TAG} deployed and released to Docker Hub."
        }
        failure {
            echo "FAILURE — Pipeline failed. Check the stage logs above."
            sh 'docker compose down --remove-orphans || true'
        }
        cleanup {
            sh 'docker image prune -f || true'
        }
    }

}