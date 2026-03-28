# AWS Deployment Guide

This guide walks you through deploying the Crisis Text Simplifier to AWS using Amplify (frontend) and Elastic Beanstalk (backend).

## Prerequisites

1. **AWS Account**: Create one at [aws.amazon.com](https://aws.amazon.com)
2. **AWS CLI**: Install and configure with your credentials
   ```bash
   # Install AWS CLI
   brew install awscli  # macOS
   
   # Configure credentials
   aws configure
   ```

3. **Elastic Beanstalk CLI**:
   ```bash
   pip install awsebcli
   ```

4. **Amplify CLI**:
   ```bash
   npm install -g @aws-amplify/cli
   amplify configure
   ```

## Step 1: Deploy Backend to Elastic Beanstalk

### Option A: Using the deployment script (Recommended)

```bash
./deploy-backend.sh
```

### Option B: Manual deployment

```bash
cd backend

# Initialize EB (first time only)
eb init -p node.js-18 crisis-text-simplifier-backend --region us-east-1

# Build TypeScript
npm run build

# Create environment (first time only)
eb create crisis-text-api --instance-type t3.small

# Or deploy to existing environment
eb deploy

# Set environment variables
eb setenv \
  OPENAI_API_KEY=your_openai_key \
  NEWS_API_KEY=your_news_api_key \
  HUME_API_KEY=your_hume_key \
  PORT=8080

# Get your backend URL
eb status
```

### Important Backend Configuration

- **Port**: Elastic Beanstalk expects your app on port 8080 (set via PORT env var)
- **Health Check**: The `/health` endpoint is used for health checks
- **Environment Variables**: Set all API keys via `eb setenv` or EB Console

## Step 2: Deploy Frontend to AWS Amplify

### Option A: Using the deployment script (Recommended)

```bash
./deploy-frontend.sh
```

### Option B: Manual deployment

```bash
cd frontend

# Initialize Amplify (first time only)
amplify init

# Add hosting
amplify add hosting
# Choose: "Hosting with Amplify Console"
# Choose: "Manual deployment"

# Build and publish
npm run build
amplify publish
```

### Option C: Git-based deployment (Continuous Deployment)

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
3. Click "New app" → "Host web app"
4. Connect your repository
5. Amplify will auto-detect the `amplify.yml` build settings
6. Deploy!

## Step 3: Connect Frontend to Backend

After both deployments:

1. Get your backend URL:
   ```bash
   cd backend
   eb status
   # Look for "CNAME" - this is your backend URL
   ```

2. Update frontend environment variable in Amplify Console:
   - Go to Amplify Console → Your App → Environment variables
   - Add: `VITE_API_URL` = `https://your-eb-url.elasticbeanstalk.com`
   - Redeploy the frontend

## Step 4: Update CORS

Update `backend/src/index.ts` to allow your Amplify domain:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-amplify-domain.amplifyapp.com'
  ]
}));
```

Then redeploy backend:
```bash
cd backend
eb deploy
```

## Monitoring & Management

### Backend (Elastic Beanstalk)

```bash
# View logs
eb logs

# Open EB console
eb console

# SSH into instance
eb ssh

# Check health
eb health
```

### Frontend (Amplify)

- View in [Amplify Console](https://console.aws.amazon.com/amplify)
- Monitor builds, deployments, and analytics
- Configure custom domains
- Set up branch-based deployments

## Cost Estimates

- **Elastic Beanstalk**: ~$15-30/month (t3.small instance)
- **Amplify Hosting**: ~$0.15/GB served + $0.01/build minute
- **Data Transfer**: Varies based on usage

## Troubleshooting

### Backend Issues

1. **Build fails**: Check that `npm run build` works locally
2. **App crashes**: Check logs with `eb logs`
3. **Environment variables**: Verify with `eb printenv`
4. **Port issues**: Ensure PORT=8080 is set

### Frontend Issues

1. **Build fails**: Check `amplify.yml` configuration
2. **API calls fail**: Verify VITE_API_URL is set correctly
3. **CORS errors**: Update backend CORS configuration

## Security Best Practices

1. **API Keys**: Never commit API keys to git
2. **Environment Variables**: Use EB environment variables for secrets
3. **HTTPS**: Both Amplify and EB provide HTTPS by default
4. **IAM Roles**: Use least-privilege IAM roles for EB instances

## Cleanup

To avoid charges when not in use:

```bash
# Terminate backend
cd backend
eb terminate crisis-text-api

# Delete frontend
cd frontend
amplify delete
```

## Next Steps

- Set up custom domain names
- Configure CloudWatch alarms
- Set up CI/CD pipelines
- Add CloudFront CDN for better performance
- Implement AWS Secrets Manager for API keys
