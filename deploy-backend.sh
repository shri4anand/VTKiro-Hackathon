#!/bin/bash

# Deploy Backend to AWS Elastic Beanstalk
# This script automates the deployment of the Node.js backend

set -e

echo "🚀 Starting Backend Deployment to AWS Elastic Beanstalk..."

# Check if EB CLI is installed
if ! command -v eb &> /dev/null; then
    echo "❌ Error: AWS Elastic Beanstalk CLI is not installed."
    echo "Install it with: pip install awsebcli"
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if EB is initialized
if [ ! -d ".elasticbeanstalk" ]; then
    echo "📋 Initializing Elastic Beanstalk..."
    echo "Please follow the prompts to configure your EB application."
    eb init -p node.js-18 crisis-text-simplifier-backend --region us-east-1
fi

# Build the TypeScript code
echo "🔨 Building TypeScript..."
npm run build

# Check if environment exists
if ! eb list | grep -q "crisis-text-api"; then
    echo "🆕 Creating new EB environment..."
    eb create crisis-text-api --instance-type t3.small --envvars \
        PORT=8080
    
    echo ""
    echo "⚠️  IMPORTANT: Set your environment variables in the EB console:"
    echo "   - OPENAI_API_KEY"
    echo "   - NEWS_API_KEY"
    echo "   - HUME_API_KEY"
    echo ""
    echo "Run: eb setenv OPENAI_API_KEY=your_key NEWS_API_KEY=your_key HUME_API_KEY=your_key"
else
    echo "📦 Deploying to existing environment..."
    eb deploy
fi

echo ""
echo "✅ Backend deployment complete!"
echo "🌐 View your application: eb open"
echo "📊 View logs: eb logs"
echo "⚙️  Configure environment: eb console"

cd ..
