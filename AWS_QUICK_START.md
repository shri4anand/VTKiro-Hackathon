# AWS Deployment Quick Start

## Prerequisites Installation

```bash
# Install AWS CLI (macOS)
brew install awscli
aws configure

# Install Elastic Beanstalk CLI
pip install awsebcli

# Install Amplify CLI
npm install -g @aws-amplify/cli
amplify configure
```

## One-Command Deployment

```bash
./setup-aws-deployment.sh
```

This interactive script will:
- Check all prerequisites
- Verify your API keys
- Guide you through backend and frontend deployment
- Provide next steps

## Manual Deployment

### Backend (Elastic Beanstalk)

```bash
cd backend
eb init -p node.js-18 crisis-text-simplifier-backend --region us-east-1
npm run build
eb create crisis-text-api --instance-type t3.small
eb setenv OPENAI_API_KEY=xxx NEWS_API_KEY=xxx HUME_API_KEY=xxx PORT=8080
```

### Frontend (Amplify)

```bash
cd frontend
amplify init
amplify add hosting
amplify publish
```

## Post-Deployment Configuration

1. **Get Backend URL**:
   ```bash
   cd backend
   eb status | grep CNAME
   ```

2. **Set Frontend Environment Variable**:
   - Go to Amplify Console
   - Navigate to your app → Environment variables
   - Add: `VITE_API_URL` = `https://your-backend-url.elasticbeanstalk.com`
   - Redeploy frontend

3. **Update Backend CORS**:
   - Edit `backend/src/index.ts`
   - Add your Amplify domain to CORS origins
   - Deploy: `eb deploy`

## Useful Commands

```bash
# Backend
eb logs                    # View logs
eb console                 # Open EB console
eb health                  # Check health
eb deploy                  # Deploy updates

# Frontend
amplify status             # Check status
amplify console            # Open Amplify console
amplify publish            # Deploy updates
```

## Troubleshooting

**Backend won't start**: Check `eb logs` and verify PORT=8080 is set

**Frontend can't reach backend**: Verify VITE_API_URL is set in Amplify Console

**CORS errors**: Update backend CORS to include your Amplify domain

**Build fails**: Ensure `npm run build` works locally first

## Cost Estimate

- Backend (t3.small): ~$15-30/month
- Frontend (Amplify): ~$0.15/GB + $0.01/build minute
- Total: ~$20-40/month for moderate usage

## Support

See `AWS_DEPLOYMENT_GUIDE.md` for detailed documentation.
