pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_TARGET',
            choices: ['docker', 'kubernetes', 'both'],
            description: 'Select where to deploy: docker only, kubernetes only, or both'
        )
    }

    environment {
        DOCKER_REGISTRY = "docker.io"
        DOCKER_CREDENTIALS_ID = "docker-hub-credentials"
        GIT_CREDENTIALS_ID = "github-pat"
        DOCKER_REPO = "nisha2706/mynode-app"

        // Ensure kubectl always knows where to look
        KUBECONFIG = "/var/jenkins_home/.kube/config"
    }

    stages {

        stage('Checkout') {
            steps { checkout scm }
        }

        stage('Set GIT SHA') {
            steps {
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()
                    env.DOCKER_IMAGE_SHA = "${DOCKER_REPO}:${env.GIT_SHA}"
                    env.DOCKER_IMAGE_LATEST = "${DOCKER_REPO}:latest"
                    echo "GIT_SHA=${env.GIT_SHA}"
                    echo "DOCKER_IMAGE_SHA=${env.DOCKER_IMAGE_SHA}"
                    echo "DOCKER_IMAGE_LATEST=${env.DOCKER_IMAGE_LATEST}"
                }
            }
        }

        stage('Verify Node.js') {
            steps {
                sh 'node -v'
                sh 'npm -v'
            }
        }

        stage('Install, Patch & Test') {
            steps {
                script {
                    sh 'npm ci'
                    sh 'npm install cross-spawn@7.0.5 || true'
                    sh 'npm test'
                    sh 'npx eslint src/**/*.js --max-warnings=0'
                    sh 'npm audit --audit-level=high'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build \
                        --build-arg GIT_SHA=${GIT_SHA} \
                        -t ${DOCKER_IMAGE_SHA} .
                    docker tag ${DOCKER_IMAGE_SHA} ${DOCKER_IMAGE_LATEST}
                """
            }
        }

        stage('Scan Docker Image') {
            steps {
                sh "trivy image --exit-code 1 --severity HIGH,CRITICAL ${DOCKER_IMAGE_SHA} || true"
            }
        }

        stage('Push & Run Docker Image') {
            when { expression { params.DEPLOY_TARGET == 'docker' || params.DEPLOY_TARGET == 'both' } }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh """
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin ${DOCKER_REGISTRY}
                        docker push ${DOCKER_IMAGE_SHA}
                        docker push ${DOCKER_IMAGE_LATEST}

                        # Stop any running container
                        docker rm -f node-app || true

                        # Run container locally with GIT_SHA env
                        docker run -d --name node-app -p 3000:3000 \
                            -e GIT_SHA=${GIT_SHA} \
                            ${DOCKER_IMAGE_LATEST}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when { expression { params.DEPLOY_TARGET == 'kubernetes' || params.DEPLOY_TARGET == 'both' } }
            steps {
                sh """
                    echo "Using KUBECONFIG=${KUBECONFIG}"

                    # Apply manifests
                    kubectl apply -f k8s/

                    # Update deployment image and inject GIT_SHA env
                    kubectl set image deployment/node-app node-app=${DOCKER_IMAGE_LATEST}
                    kubectl set env deployment/node-app GIT_SHA=${GIT_SHA}

                    # Wait for rollout
                    kubectl rollout status deployment/node-app --timeout=2m
                """
            }
        }

        stage('Push to GitHub') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${GIT_CREDENTIALS_ID}",
                    usernameVariable: 'GIT_USER',
                    passwordVariable: 'GIT_TOKEN'
                )]) {
                    sh """
                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@example.com"
                        git remote set-url origin https://${GIT_USER}:${GIT_TOKEN}@github.com/Nisha123-rani/mynode-app.git
                        git checkout -B main
                        git add .
                        git commit -m "CI: update from Jenkins build ${GIT_SHA}" || echo "No changes to commit"
                        git push origin main
                    """
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up Docker images"
            sh "docker rmi ${DOCKER_IMAGE_SHA} ${DOCKER_IMAGE_LATEST} || true"
        }
        failure {
            echo "Build failed! Check console output for errors."
        }
        success {
            echo "Pipeline completed successfully!"
        }
    }
}

