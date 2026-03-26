# Deployment Guide

## Environment Configuration

After deploying, you need to configure the environment variables to point to your deployed server URLs.

### Backend Configuration (.env)

Update the root `.env` file with your deployed frontend URL:

```bash
# =============================================================================
# FRONTEND URL CONFIGURATION (for password reset links)
# =============================================================================
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Configuration (client/.env)

Update the `client/.env` file with your deployed backend URL:

```bash
# Backend API URL - Change this to your deployed server URL
VITE_API_URL=https://your-backend-domain.com
```

## Building for Production

### Frontend Build

1. Update the `client/.env` file with your production backend URL
2. Build the React frontend:

```bash
cd client
npm run build
```

The build output will be in `client/dist/` and can be served by any static web server (Nginx, Apache, etc.).

### Backend Deployment

1. Make sure the `.env` file in the root directory has the correct `FRONTEND_URL`
2. The backend will serve the frontend from the `/dist` folder if available, or you can serve them separately

## Common Deployment Platforms

### Example: Deploying Backend and Frontend on Different Domains

If your backend is at `https://api.zerohealth.com` and frontend at `https://zerohealth.com`:

**Backend .env:**
```bash
FRONTEND_URL=https://zerohealth.com
```

**Frontend client/.env:**
```bash
VITE_API_URL=https://api.zerohealth.com
```

### Example: Same Domain with Path

If you're serving both from the same domain with the API at `/api`:

**Frontend client/.env:**
```bash
VITE_API_URL=https://zerohealth.com
```

Then configure your reverse proxy (Nginx) to:
- Serve frontend files from `/`
- Proxy `/api` requests to the backend server

## Docker Deployment

If using Docker, update the environment variables in your `docker-compose.yml` or pass them when running:

```bash
docker-compose up -d
```

Make sure to update the environment variables in the compose file for production deployments.

## Troubleshooting

### Frontend calls localhost after deployment

1. Make sure you've updated `client/.env` with the correct `VITE_API_URL`
2. Rebuild the frontend after changing environment variables: `cd client && npm run build`
3. Clear your browser cache to ensure it loads the new built files

### Password reset links point to localhost

1. Check that the backend `.env` file has the correct `FRONTEND_URL`
2. Restart the backend server after updating the `.env` file

### CORS Errors

If you encounter CORS errors when frontend and backend are on different domains, ensure your backend includes the appropriate CORS headers for your frontend domain.
