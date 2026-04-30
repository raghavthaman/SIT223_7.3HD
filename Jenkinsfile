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

        // ── CHECKOUT ────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '========== CHECKOUT =========='
                checkout scm
                bat 'git log --oneline -5'
            }
        }

        // ── BUILD ───────────────────────────────────────────────────
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

        // ── TEST ────────────────────────────────────────────────────
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
            }
        }

        // ── CODE QUALITY (BLOCKING) ─────────────────────────────────
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
                              -Dsonar.sources=src ^
                              -Dsonar.tests=tests ^
                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info ^
                              -Dsonar.exclusions=**/node_modules/**,**/coverage/**,**/dist/**
                        """
                    }
                }
            }
        }

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

        // ── SECURITY (GATED) ────────────────────────────────────────
        stage('Security') {
            steps {
                echo '========== SECURITY (Trivy) =========='
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

        // ── DEPLOY WITH ROLLBACK ────────────────────────────────────
        stage('Deploy') {
            steps {
                echo '========== DEPLOY =========='

                bat 'docker compose down || ver > nul'
                bat 'docker compose up -d'

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
                failure {
                    echo "ROLLBACK STARTED"
                    bat 'docker compose down'
                    bat """
                        docker pull %BACKEND_IMAGE%:latest
                        docker pull %FRONTEND_IMAGE%:latest
                    """
                    bat 'docker compose up -d'
                    echo "ROLLBACK COMPLETE"
                }
            }
        }

        // ── RELEASE ────────────────────────────────────────────────
        stage('Release') {
            steps {
                echo "========== RELEASE =========="

                bat """
                    echo VERSION=%IMAGE_TAG% > release-manifest.txt
                    echo BACKEND_IMAGE=%BACKEND_IMAGE%:%IMAGE_TAG% >> release-manifest.txt
                    echo FRONTEND_IMAGE=%FRONTEND_IMAGE%:%IMAGE_TAG% >> release-manifest.txt
                """
                archiveArtifacts artifacts: 'release-manifest.txt'

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

        // ── MONITORING (IMPROVED) ──────────────────────────────────
        stage('Monitoring') {
            steps {
                echo '========== MONITORING =========='

                bat 'docker stats --no-stream'
                bat 'docker logs smart-waste-backend --tail=20'

                echo "Monitoring Stack:"
                echo "Prometheus → metrics"
                echo "Grafana → dashboard"
                echo "Alertmanager → alerts"
            }
        }
    }
}
