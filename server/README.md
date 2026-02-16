
# AutoJob Flow Server

Backend server for the AutoJob Flow application with Google OAuth authentication and job automation features.

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Fill in all the required environment variables:
     - Google OAuth credentials from Google Cloud Console
     - MongoDB connection string
     - API keys for external services

3. **Google OAuth Setup**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3001/auth/google/callback`

4. **Database Setup**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env` file

5. **Run the Server**
   ```bash
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `POST /auth/logout` - Logout user
- `GET /auth/status` - Check authentication status

### Features
- `POST /api/ats-check` - Upload resume for ATS analysis
- `POST /api/cold-email-setup` - Setup cold email campaign
- `POST /api/job-search` - Search for jobs

## Features to Implement

1. **ATS Resume Analysis**
   - Integrate with Affinda API or similar
   - Parse resume content
   - Generate optimization suggestions

2. **Cold Email Automation**
   - Google Sheets API integration
   - Gmail API for sending emails
   - Email template generation with AI

3. **Job Search Integration**
   - Serper.dev API for job listings
   - RapidAPI job search endpoints
   - Job data parsing and filtering

4. **AI Features**
   - Cover letter generation (Gemini Pro/OpenAI)
   - Email personalization
   - Job matching algorithms

## Security Notes

- Always use HTTPS in production
- Keep API keys secure and never commit them
- Implement rate limiting
- Add input validation and sanitization
- Use JWT tokens for API authentication
