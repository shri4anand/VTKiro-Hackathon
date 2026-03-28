#!/bin/bash

# Deploy Frontend to AWS Amplify
# This script guides you through deploying the React frontend

set -e

echo "🚀 Starting Frontend Deployment to AWS Amplify..."

# Check if Amplify CLI is installed
if ! command -v amplify &> /dev/null; then
    echo "❌ Error: AWS Amplify CLI is not installed."
    echo "Install it with: npm install -g @aws-amplify/cli"
    exit 1
fi

# Navigate to frontend directory
cd frontend

# Check if Amplify is initialized
if [ ! -d "amplify" ]; then
    echo "📋 Initializing AWS Amplify..."
    echo "Please follow the prompts to configure your Amplify project."
    amplify init
    
    echo ""
    echo "🌐 Adding hosting..."
    amplify add hosting
fi

# Build the application
echo "🔨 Building React application..."
npm run build

# Publish to Amplify
echo "📤 Publishing to AWS Amplify..."
amplify publish

echo ""
echo "✅ Frontend deployment complete!"
echo "🌐 Your app is now live on AWS Amplify"
echo ""
echo "⚠️  IMPORTANT: Update your frontend environment variable:"
echo "   Set VITE_API_URL to your Elastic Beanstalk backend URL"
echo "   You can do this in the Amplify Console under Environment Variables"

cd ..
