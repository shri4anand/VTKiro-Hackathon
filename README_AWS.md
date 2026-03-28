# AWS Deployment - Crisis Text Simplifier

This project is now configured for deployment to AWS using:
- **AWS Amplify** for the React frontend
- **AWS Elastic Beanstalk** for the Node.js backend

## Quick Start

```bash
./setup-aws-deployment.sh
```

This interactive script will guide you through the entire deployment process.

## Documentation

- **[AWS_QUICK_START.md](AWS_QUICK_START.md)** - Fast deployment guide with essential commands
- **[AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)** - Comprehensive deployment documentation
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

## What's Been Configured

### Backend (Elastic Beanstalk)
- ✅ `.ebignore` - Excludes unnecessary files from deployment
- ✅ `.elasticbeanstalk/config.yml` - EB configuration
- ✅ `Procfile` - Tells EB how to start the app
- ✅ `.platform/nginx/conf.d/proxy.conf` - Nginx configuration
- ✅ CORS configuration updated in `src/index.ts`
- ✅ PORT environment variable support

### Frontend (Amplify)
- ✅ `amplify.yml` - Build configuration for Amplify
- ✅ `src/config.ts` - Centralized API URL configuration
- ✅ All API calls updated to use `VITE_API_URL` environment variable
- ✅ Hooks updated: `useSimplify`, `useFeedPoller`, `useTTS`
- ✅ Components updated: `FeedPanel`

### Deployment Scripts
- ✅ `setup-aws-deployment.sh` - Interactive deployment wizard
- ✅ `deploy-backend.sh` - Backend deployment automation
- ✅ `deploy-frontend.sh` - Frontend deployment automation

## Architecture

```
┌─────────────────┐
│   CloudFront    │ (Optional CDN)
└────────┬────────┘
         │
┌────────▼────────┐
│  AWS Amplify    │ (Frontend Hosting)
│  React + Vite   │
└────────┬────────┘
         │ HTTPS
┌────────▼────────┐
│ Elastic Beanstalk│ (Backend API)
│  Node.js + Express│
└────────┬────────┘
         │
    ┌────┴────┐
    │ External APIs │
    │ - OpenAI      │
    │ - NewsAPI     │
    │ - Hume TTS    │
    └──────────────┘
```

## Environment Variables

### Backend (Set in EB Console or via `eb setenv`)
- `OPENAI_API_KEY` - Your OpenAI API key
- `NEWS_API_KEY` - Your News API key
- `HUME_API_KEY` - Your Hume AI API key
- `PORT` - Set to 8080 (required by EB)

### Frontend (Set in Amplify Console)
- `VITE_API_URL` - Your Elastic Beanstalk backend URL

## Deployment Flow

1. **Deploy Backend First**
   ```bash
   cd backend
   eb init
   eb create
   eb setenv OPENAI_API_KEY=xxx NEWS_API_KEY=xxx HUME_API_KEY=xxx PORT=8080
   ```

2. **Get Backend URL**
   ```bash
   eb status | grep CNAME
   ```

3. **Deploy Frontend**
   ```bash
   cd frontend
   amplify init
   amplify add hosting
   amplify publish
   ```

4. **Configure Frontend**
   - Add `VITE_API_URL` in Amplify Console
   - Redeploy frontend

5. **Update Backend CORS**
   - Add Amplify domain to `backend/src/index.ts`
   - Run `eb deploy`

## Cost Estimate

- **Elastic Beanstalk (t3.small)**: ~$15-30/month
- **Amplify Hosting**: ~$0.15/GB served + $0.01/build minute
- **Total**: ~$20-40/month for moderate usage

## Support & Troubleshooting

Common issues and solutions:

**Backend won't start**: 
- Check logs: `eb logs`
- Verify PORT=8080 is set: `eb printenv`

**Frontend can't reach backend**:
- Verify VITE_API_URL is set in Amplify Console
- Check CORS configuration in backend

**Build fails**:
- Test locally first: `npm run build`
- Check build logs in respective consoles

## Next Steps After Deployment

1. Set up custom domain names
2. Configure SSL certificates (auto-provided by AWS)
3. Set up CloudWatch monitoring and alarms
4. Configure auto-scaling (if needed)
5. Set up CI/CD pipelines for automated deployments
6. Implement AWS Secrets Manager for API keys

## Useful Commands

```bash
# Backend
eb status          # Check deployment status
eb logs            # View application logs
eb console         # Open EB console in browser
eb deploy          # Deploy code changes
eb terminate       # Delete environment

# Frontend
amplify status     # Check deployment status
amplify console    # Open Amplify console
amplify publish    # Deploy changes
amplify delete     # Delete app
```

## Security Best Practices

- ✅ API keys stored as environment variables (not in code)
- ✅ HTTPS enabled by default on both services
- ✅ CORS configured to restrict origins
- ✅ `.env` files excluded from git
- ⚠️ Consider AWS Secrets Manager for production
- ⚠️ Review IAM roles and permissions
- ⚠️ Enable CloudWatch logging for monitoring

## Rollback

If you need to rollback a deployment:

```bash
# Backend
cd backend
eb deploy --version <previous-version>

# Frontend
# Use Amplify Console to redeploy a previous build
```

## Cleanup

To avoid charges when not using the application:

```bash
# Terminate backend
cd backend
eb terminate crisis-text-api

# Delete frontend
cd frontend
amplify delete
```

---

For detailed instructions, see [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)
