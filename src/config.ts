export const AUDIENSE_API_BASE = "https://api.audiense.com/v1";

export const CLIENT_ID = process.env.AUDIENSE_CLIENT_ID || "";
export const CLIENT_SECRET = process.env.AUDIENSE_CLIENT_SECRET || "";

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Missing Audiense API credentials. Check your environment variables.");
}

export const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || "";
export const TWITTER_API_BASE = "https://api.twitter.com/2";