#!/bin/bash

# AWS Deployment Setup Script
# This script checks prerequisites and guides you through the deployment process

set -e

echo "🚀 Crisis Text Simplifier - AWS Deployment Setup"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check AWS CLI
if command -v aws &> /dev/null; then
    echo -e "${GREEN}✓${NC} AWS CLI is installed"
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "not configured")
    if [ "$AWS_ACCOUNT" != "not configured" ]; then
        echo -e "  Account: $AWS_ACCOUNT"
    else
        echo -e "${YELLOW}⚠${NC}  AWS CLI not configured. Run: aws configure"
    fi
else
    echo -e "${RED}✗${NC} AWS CLI is not installed"
    echo "  Install: brew install awscli (macOS)"
    exit 1
fi

echo ""

# Check EB CLI
if command -v eb &> /dev/null; then
    echo -e "${GREEN}✓${NC} Elastic Beanstalk CLI is installed"
else
    echo -e "${RED}✗${NC} Elastic Beanstalk CLI is not installed"
    echo "  Install: pip install awsebcli"
    exit 1
fi

echo ""

# Check Amplify CLI
if command -v amplify &> /dev/null; then
    echo -e "${GREEN}✓${NC} Amplify CLI is installed"
else
    echo -e "${YELLOW}⚠${NC} Amplify CLI is not installed"
    echo "  Install: npm install -g @aws-amplify/cli"
    echo "  Then run: amplify configure"
fi

echo ""
echo "=================================================="
echo ""

# Check environment variables
echo "🔐 Checking required environment variables..."
echo ""

MISSING_VARS=0

if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓${NC} backend/.env file exists"
    
    # Check for required keys
    if grep -q "OPENAI_API_KEY=" backend/.env && ! grep -q "OPENAI_API_KEY=$" backend/.env; then
        echo -e "${GREEN}✓${NC} OPENAI_API_KEY is set"
    else
        echo -e "${RED}✗${NC} OPENAI_API_KEY is missing"
        MISSING_VARS=1
    fi
    
    if grep -q "NEWS_API_KEY=" backend/.env && ! grep -q "NEWS_API_KEY=$" backend/.env; then
        echo -e "${GREEN}✓${NC} NEWS_API_KEY is set"
    else
        echo -e "${RED}✗${NC} NEWS_API_KEY is missing"
        MISSING_VARS=1
    fi
    
    if grep -q "HUME_API_KEY=" backend/.env && ! grep -q "HUME_API_KEY=$" backend/.env; then
        echo -e "${GREEN}✓${NC} HUME_API_KEY is set"
    else
        echo -e "${RED}✗${NC} HUME_API_KEY is missing"
        MISSING_VARS=1
    fi
else
    echo -e "${RED}✗${NC} backend/.env file not found"
    echo "  Copy backend/.env.example to backend/.env and fill in your API keys"
    MISSING_VARS=1
fi

echo ""

if [ $MISSING_VARS -eq 1 ]; then
    echo -e "${YELLOW}⚠${NC} Some environment variables are missing."
    echo "  You'll need to set them in Elastic Beanstalk after deployment."
    echo ""
fi

echo "=================================================="
echo ""

# Deployment options
echo "📦 Deployment Options:"
echo ""
echo "1. Deploy Backend only (Elastic Beanstalk)"
echo "2. Deploy Frontend only (Amplify)"
echo "3. Deploy Both (Full deployment)"
echo "4. Exit"
echo ""

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying Backend to Elastic Beanstalk..."
        ./deploy-backend.sh
        ;;
    2)
        echo ""
        echo "🚀 Deploying Frontend to Amplify..."
        ./deploy-frontend.sh
        ;;
    3)
        echo ""
        echo "🚀 Starting Full Deployment..."
        echo ""
        echo "Step 1: Deploying Backend..."
        ./deploy-backend.sh
        
        echo ""
        echo "Step 2: Getting Backend URL..."
        cd backend
        BACKEND_URL=$(eb status | grep "CNAME" | awk '{print $2}')
        cd ..
        
        if [ -n "$BACKEND_URL" ]; then
            echo -e "${GREEN}✓${NC} Backend URL: https://$BACKEND_URL"
            echo ""
            echo "⚠️  IMPORTANT: You'll need to set VITE_API_URL=https://$BACKEND_URL in Amplify Console"
            echo ""
            read -p "Press Enter to continue with frontend deployment..."
        fi
        
        echo ""
        echo "Step 3: Deploying Frontend..."
        ./deploy-frontend.sh
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo ""
echo "✅ Deployment process complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Set environment variables in EB Console (if not done)"
echo "2. Update CORS in backend to allow your Amplify domain"
echo "3. Set VITE_API_URL in Amplify Console"
echo "4. Test your deployed application"
echo ""
echo "📖 See AWS_DEPLOYMENT_GUIDE.md for detailed instructions"
