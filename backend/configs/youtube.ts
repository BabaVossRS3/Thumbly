import { google } from 'googleapis';

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const redirectUri = process.env.YOUTUBE_REDIRECT_URI;

if (!clientId || !clientSecret || !redirectUri) {
  console.error('❌ YouTube API credentials are missing!');
  console.error('Required env vars: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REDIRECT_URI');
}

const oauth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectUri
);

export const youtube = google.youtube({
  version: 'v3',
  auth: oauth2Client,
});

export { oauth2Client };
