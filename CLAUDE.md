# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `node server.js` - Direct server execution

### Docker
- `docker-compose up` - Run service in Docker container
- `docker-compose up -d` - Run service in background
- `docker build .` - Build Docker image

## Architecture

This is a GitHub stats visualization service that generates animated SVG graphics displaying user statistics.

### Core Components
- **Express Server** (`server.js`): Single-file Node.js server handling API requests
- **GitHub API Integration**: Fetches user data and repository information using GitHub REST API
- **SVG Generation**: Creates animated SVG graphics with gradients, animations, and visual effects

### API Endpoints
- `GET /api/stats?username=<username>` - Returns animated SVG with GitHub stats
- `GET /health` - Health check endpoint
- `GET /` - Service information and available endpoints

### Environment Variables
- `GITHUB_TOKEN` - GitHub personal access token (optional but recommended for higher rate limits)
- `PORT` - Server port (defaults to 3000)

### Key Features
- Fetches real GitHub user data (repos, followers, following)
- Generates estimated commit counts and line changes for visualization
- Returns cached SVG responses (30min cache)
- Handles API errors with styled error SVGs
- Supports CORS for cross-origin requests

The service is containerized and designed to be deployed as a microservice for generating GitHub profile statistics visualizations.