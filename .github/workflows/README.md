# GitHub Workflows

## Disabled Workflows

### deploy.yml.disabled
The GitHub Pages deployment workflow has been disabled because this is a full-stack application with:
- **Frontend:** Vue.js 3 + Vite
- **Backend:** Node.js + Express + MongoDB
- **Database:** MongoDB Atlas

GitHub Pages only supports static sites and cannot host:
- Backend APIs
- Database connections
- Server-side logic

## Future Deployment Options

For deploying this full-stack application, consider:

### Frontend:
- Vercel
- Netlify
- AWS Amplify
- Azure Static Web Apps

### Backend:
- Heroku
- Railway
- Render
- AWS EC2/ECS
- Azure App Service
- DigitalOcean App Platform

### Full-Stack Platforms:
- Vercel (Frontend) + Railway (Backend)
- Netlify (Frontend) + Render (Backend)
- AWS (Frontend: S3+CloudFront, Backend: ECS/Lambda)

## Re-enabling GitHub Pages

If you want to enable GitHub Pages for documentation only:
1. Rename `deploy.yml.disabled` back to `deploy.yml`
2. Create a separate `docs` branch with static documentation
3. Configure GitHub Pages to deploy from the `docs` branch
