pipeline {
    agent any

    environment {
        DOCKER_CREDS    = credentials('dockerhub-credentials')
        BACKEND_IMAGE   = "${DOCKER_CREDS_USR}/smart-waste-backend"
        FRONTEND_IMAGE  = "${DOCKER_CREDS_USR}/smart-waste-frontend"
        IMAGE_TAG       = "v1.0.${BUILD_NUMBER}"

        SONAR_TOKEN     = credentials('sonarcloud-token')
        SONAR_ORG       = 'raghavthaman'
        SONAR_PROJECT   = 'raghavthaman_SIT223_7.3HD'
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        // ── 1. CHECKOUT ─────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '========== CHECKOUT =========='
                checkout scm
                bat 'git log --oneline -5'
            }
        }

        // ── 2. BUILD ────────────────────────────────────────────
        stage('Build') {
            steps {
                echo "========== BUILD: ${IMAGE_TAG} =========="
                bat """
                    docker build -t %BACKEND_IMAGE%:%IMAGE_TAG% -t %BACKEND_IMAGE%:latest ./backend
                """
                bat """
                    docker build -t %FRONTEND_IMAGE%:%IMAGE_TAG% -t %FRONTEND_IMAGE%:latest ./frontend
                """
                bat "echo %IMAGE_TAG% > build-version.txt"
                archiveArtifacts artifacts: 'build-version.txt', fingerprint: true
            }
        }

        // ── 3. TEST ─────────────────────────────────────────────
        stage('Test') {
            steps {
                echo '========== TEST =========='
                dir('backend') {
                    bat 'call npm ci'
                    bat 'call npx jest --coverage --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    junit 'backend/junit.xml'
                }
                success {
                    echo 'TEST PASSED'
                }
                failure {
                    error 'TEST FAILED — stopping pipeline'
                }
            }
        }

        // ── 4. CODE QUALITY (SONARCLOUD) ────────────────────────
        stage('Code Quality') {
            steps {
                echo '========== SONARCLOUD =========='
                dir('backend') {
                    withSonarQubeEnv('My SonarQube Server') {
                        bat """
                            sonar-scanner ^
                              -Dsonar.host.url=https://sonarcloud.io ^
                              -Dsonar.token=%SONAR_TOKEN% ^
                              -Dsonar.organization=%SONAR_ORG% ^
                              -Dsonar.projectKey=%SONAR_PROJECT% ^
                              -Dsonar.projectName="Smart Waste Backend" ^
                              -Dsonar.sources=src ^
                              -Dsonar.tests=tests ^
                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info ^
                              -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/dist/**
                        """
                    }
                }
            }
        }

        // ── 5. QUALITY GATE (NON-BLOCKING) ──────────────────────
        stage('Quality Gate') {
            steps {
                script {
                    timeout(time: 2, unit: 'MINUTES') {
                        def qg = waitForQualityGate abortPipeline: false
                        echo "Quality Gate Status: ${qg.status}"
                    }
                }
            }
        }

        // ── 6. SECURITY (TRIVY) ─────────────────────────────────
        stage('Security') {
            steps {
                echo '========== SECURITY =========='
                bat """
                    C:\\Users\\91887\\scoop\\shims\\trivy.exe fs ^
                        --severity HIGH,CRITICAL ^
                        --exit-code 1 ^
                        --format table ^
                        --output trivy-report.txt ^
                        .
                """
                bat 'type trivy-report.txt'
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report.txt'
                }
            }
        }

        // ── 7. DEPLOY ───────────────────────────────────────────
        stage('Deploy') {
            steps {
                echo '========== DEPLOY =========='

                bat 'docker compose down || ver > nul'
                bat 'docker compose up -d'

                echo 'Waiting for services...'
                sleep 20

                script {
                    def status = bat(returnStatus: true,
                        script: 'curl -f http://localhost:5000/health')

                    if (status != 0) {
                        error "DEPLOY FAILED"
                    }
                }
            }
            post {
                success {
                    echo 'DEPLOY SUCCESS'
                }
                failure {
                    echo 'ROLLBACK STARTED'
                    bat 'docker compose down'
                    bat 'docker compose up -d'
                }
            }
        }

        // ── 8. RELEASE ──────────────────────────────────────────
        stage('Release') {
            steps {
                echo "========== RELEASE =========="

                bat """
                    echo %DOCKER_CREDS_PSW% | docker login -u %DOCKER_CREDS_USR% --password-stdin
                    docker push %BACKEND_IMAGE%:%IMAGE_TAG%
                    docker push %FRONTEND_IMAGE%:%IMAGE_TAG%
                """

                bat """
                    git tag %IMAGE_TAG%
                    git push origin %IMAGE_TAG%
                """
            }
        }

        // ── 9. MONITORING ───────────────────────────────────────
        stage('Monitoring') {
            steps {
                echo '========== MONITORING =========='

                bat 'docker stats --no-stream'
                bat 'docker logs smart-waste-backend --tail=20'

                echo "Prometheus: http://localhost:9090"
                echo "Grafana: http://localhost:3000"
                echo "Metrics: http://localhost:5000/metrics"
            }
        }
    }

    post {
        always {
            echo "Pipeline completed: ${currentBuild.currentResult}"
        }
        failure {
            echo "Pipeline failed — check logs"
        }
        success {
            echo "SUCCESS — All stages executed"
        }
    }
}
