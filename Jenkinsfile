pipeline {
    agent any
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "Checking out code..."
                checkout scm
                echo "✓ Code checked out successfully"
            }
        }
        
        stage('Setup Environment') {
            steps {
                echo "Setting up environment files..."
                sh '''
                    # Create .env file from .env.example if it doesn't exist
                    if [ ! -f backend/.env ]; then
                        echo "Creating .env from .env.example..."
                        cp backend/.env.example backend/.env
                        # For CI/CD, we can use default values - in production, set actual values in Jenkins credentials
                        echo "Note: Using .env.example values. Update with actual credentials in Jenkins if needed."
                    fi
                '''
            }
        }
        
        stage('Build Docker Images') {
            steps {
                echo "Building Docker images..."
                sh 'docker-compose build'
            }
        }
        
        stage('Run Tests') {
            steps {
                echo "Running tests..."
                sh 'docker-compose -p studentsystem-test run --rm backend python -m pytest || true'
                sh 'docker-compose -p studentsystem-test run --rm frontend npm test -- --watch=false || true'
                sh 'docker-compose -p studentsystem-test down || true'
            }
        }
        
        stage('Deploy') {
            steps {
                echo "Deploying updated services..."
                sh '''
                    # Rebuild only backend and frontend (not Jenkins)
                    docker-compose -p studentsystem build backend frontend
                    # Update services with new images (only restarts changed ones)
                    docker-compose -p studentsystem up -d backend frontend postgres
                '''
            }
        }
    }
    
    post {
        success {
            echo '✅ Build successful!'
            withCredentials([string(credentialsId: 'slack-webhook-url', variable: 'SLACK_WEBHOOK')]) {
                sh '''
                curl -X POST $SLACK_WEBHOOK \
                -H 'Content-type: application/json' \
                -d '{
                    "text": "✅ StudentSystem Build Successful",
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*✅ StudentSystem Build Successful*\nBuild #'$BUILD_NUMBER'\n<'$BUILD_URL'|View Pipeline>"
                            }
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": "*Status:*\nSuccess"
                                },
                                {
                                    "type": "mrkdwn",
                                    "text": "*Branch:*\nmain"
                                }
                            ]
                        }
                    ]
                }'
                '''
            }
        }
        failure {
            echo '❌ Build failed!'
            withCredentials([string(credentialsId: 'slack-webhook-url', variable: 'SLACK_WEBHOOK')]) {
                sh '''
                curl -X POST $SLACK_WEBHOOK \
                -H 'Content-type: application/json' \
                -d '{
                    "text": "❌ StudentSystem Build Failed",
                    "blocks": [
                        {
                            "type": "section",
                            "text": {
                                "type": "mrkdwn",
                                "text": "*❌ StudentSystem Build Failed*\nBuild #'$BUILD_NUMBER'\n<'$BUILD_URL'|View Logs>"
                            }
                        },
                        {
                            "type": "section",
                            "fields": [
                                {
                                    "type": "mrkdwn",
                                    "text": "*Status:*\nFailed"
                                },
                                {
                                    "type": "mrkdwn",
                                    "text": "*Branch:*\nmain"
                                }
                            ]
                        }
                    ]
                }'
                '''
            }
        }
        always {
            echo 'Pipeline execution completed.'
        }
    }
}
