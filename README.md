# BulkMail Studio

BulkMail Studio is a full stack bulk email app built with React, Express, MongoDB, and Gmail SMTP through Nodemailer. It supports:

- Writing a subject and email body
- Adding recipients manually
- Uploading Excel or CSV files containing email addresses
- Sending real Gmail messages
- Saving send history in MongoDB
- Deploying the frontend and API together on Vercel

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Mail delivery: Nodemailer with Gmail App Password
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
   - `GMAIL_USER`: the Gmail address that will send emails
   - `GMAIL_APP_PASSWORD`: Gmail app password, not your normal Gmail password
   - `EMAIL_FROM_NAME`: sender display name

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open the frontend at `http://localhost:5173`

## Gmail Setup

To send real Gmail messages:

1. Turn on 2-Step Verification for your Gmail account.
2. Create an App Password in your Google account security settings.
3. Put that app password into `GMAIL_APP_PASSWORD`.

Do not use your normal Gmail password in this project.

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
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `EMAIL_FROM_NAME`

4. Deploy.

Vercel will build the React frontend and expose the Express API through the `api` folder.

## Important Notes

- Gmail has daily sending limits. Test with a small recipient list first.
- For large campaigns, dedicated transactional email providers are more reliable than Gmail.
- MongoDB must be reachable from Vercel, so allow network access from Vercel in your MongoDB setup.
