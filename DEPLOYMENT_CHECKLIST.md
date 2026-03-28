# AWS Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

- [ ] AWS account created and configured
- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Elastic Beanstalk CLI installed (`pip install awsebcli`)
- [ ] Amplify CLI installed (`npm install -g @aws-amplify/cli`)
- [ ] Amplify CLI configured (`amplify configure`)
- [ ] All API keys obtained:
  - [ ] OpenAI API Key
  - [ ] News API Key
  - [ ] Hume API Key
- [ ] Backend `.env` file configured with API keys
- [ ] Local build works (`npm run build` in both frontend and backend)
- [ ] Local tests pass (`npm test` in both frontend and backend)

## Backend Deployment (Elastic Beanstalk)

- [ ] Navigate to backend directory
- [ ] Initialize EB: `eb init -p node.js-18 crisis-text-simplifier-backend --region us-east-1`
- [ ] Build TypeScript: `npm run build`
- [ ] Create environment: `eb create crisis-text-api --instance-type t3.small`
- [ ] Set environment variables:
  ```bash
  eb setenv \
    OPENAI_API_KEY=your_key \
    NEWS_API_KEY=your_key \
    HUME_API_KEY=your_key \
    PORT=8080
  ```
- [ ] Verify deployment: `eb status`
- [ ] Test health endpoint: `curl https://your-url.elasticbeanstalk.com/health`
- [ ] Note backend URL from `eb status` output

## Frontend Deployment (Amplify)

- [ ] Navigate to frontend directory
- [ ] Initialize Amplify: `amplify init`
- [ ] Add hosting: `amplify add hosting`
- [ ] Build locally: `npm run build`
- [ ] Publish: `amplify publish`
- [ ] Note frontend URL from Amplify output

## Post-Deployment Configuration

- [ ] Update Amplify environment variables:
  - [ ] Go to Amplify Console
  - [ ] Add `VITE_API_URL` = `https://your-backend-url.elasticbeanstalk.com`
  - [ ] Redeploy frontend
- [ ] Update backend CORS:
  - [ ] Edit `backend/src/index.ts`
  - [ ] Add Amplify domain to `allowedOrigins` array
  - [ ] Deploy: `eb deploy`
- [ ] Test full application flow:
  - [ ] Visit frontend URL
  - [ ] Test text simplification
  - [ ] Test feed loading
  - [ ] Test TTS functionality
  - [ ] Test language toggle

## Monitoring Setup

- [ ] Set up CloudWatch alarms for backend
- [ ] Configure Amplify build notifications
- [ ] Set up error tracking (optional)
- [ ] Configure custom domain (optional)

## Security Review

- [ ] Verify API keys are not in source code
- [ ] Confirm HTTPS is enabled (default for both services)
- [ ] Review IAM roles and permissions
- [ ] Check security group settings in EB
- [ ] Verify CORS configuration is restrictive

## Documentation

- [ ] Document backend URL
- [ ] Document frontend URL
- [ ] Update team documentation with deployment info
- [ ] Save EB and Amplify configuration details

## Testing

- [ ] Test from different devices
- [ ] Test from different networks
- [ ] Verify error handling works
- [ ] Check loading states
- [ ] Test all API endpoints
- [ ] Verify TTS works in production

## Cleanup (if needed)

To avoid charges when not in use:

- [ ] Terminate backend: `eb terminate crisis-text-api`
- [ ] Delete frontend: `amplify delete`
- [ ] Remove CloudWatch logs (if desired)

## Troubleshooting Commands

If issues arise, use these commands:

```bash
# Backend
eb logs                    # View application logs
eb ssh                     # SSH into instance
eb health                  # Check health status
eb console                 # Open EB console
eb printenv                # View environment variables

# Frontend
amplify status             # Check deployment status
amplify console            # Open Amplify console
```

## Success Criteria

- [ ] Frontend loads without errors
- [ ] Backend health check returns 200
- [ ] Text simplification works end-to-end
- [ ] Feed loads and displays articles
- [ ] TTS plays audio successfully
- [ ] No CORS errors in browser console
- [ ] All environment variables are set correctly
- [ ] Application is accessible via HTTPS

## Notes

Use this space to record any deployment-specific information:

- Backend URL: _______________________________________________
- Frontend URL: _______________________________________________
- Deployment Date: _______________________________________________
- AWS Region: _______________________________________________
- Instance Type: _______________________________________________
- Any custom configurations: _______________________________________________
