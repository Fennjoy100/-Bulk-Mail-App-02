# BulkMail Studio

BulkMail Studio is a full stack bulk email app built with React, Express, MongoDB, and Resend. It supports:

- Writing a subject and email body
- Adding recipients manually
- Uploading Excel or CSV files containing email addresses
- Sending real bulk emails through Resend
- Saving send history in MongoDB
- Deploying the frontend and API together on Vercel

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Mail delivery: Resend email API
- Spreadsheet parsing: `xlsx`

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file from `.env.example`.

3. Add your values:

   - `MONGODB_URI`: your MongoDB connection string
   - `MONGODB_DB_NAME`: optional database name
   - `RESEND_API_KEY`: your Resend API key
   - `RESEND_FROM_EMAIL`: sender email, such as `onboarding@resend.dev` for testing or a verified domain email for production
   - `REPLY_TO_EMAIL`: optional reply-to email address
   - `EMAIL_FROM_NAME`: sender display name
   - `EMAIL_BATCH_SIZE`: optional, defaults to `50`

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open the frontend at `http://localhost:5173`

## Resend Setup

To send real emails:

1. Create a Resend account.
2. Create an API key in the Resend dashboard.
3. Add it to `RESEND_API_KEY`.
4. For production sending, verify your domain in Resend and set `RESEND_FROM_EMAIL` to that sender address.

You can use `onboarding@resend.dev` for initial testing, but verified domains are the correct production setup.

## Excel / CSV Upload Format

The app scans the uploaded file for email addresses anywhere in the sheet. A single column like this works well:

```text
email
first@gmail.com
second@gmail.com
third@gmail.com
```

You can also keep adding emails manually in the text area.

## API Routes

- `GET /api/health`
- `GET /api/history`
- `POST /api/send`

## Deploy to Vercel

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. In Vercel project settings, add these environment variables:

   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `REPLY_TO_EMAIL`
   - `EMAIL_FROM_NAME`
   - `EMAIL_BATCH_SIZE`

4. Deploy.

Vercel will build the React frontend and expose the Express API through the `api` folder.

## Important Notes

- Resend is better suited to Vercel serverless functions than Gmail SMTP.
- Resend supports verified custom domains for production sending.
- MongoDB must be reachable from Vercel, so allow network access from Vercel in your MongoDB setup.
