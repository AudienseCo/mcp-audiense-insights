import fetch from "node-fetch";
import base64 from "base-64";
import { AuthResponse, IntelligenceReportsResponse, ReportInfoResponse } from "./types.js";

const { encode: base64Encode } = base64;

import { AUDIENSE_API_BASE, CLIENT_ID, CLIENT_SECRET, TWITTER_BEARER_TOKEN, TWITTER_API_BASE } from "./config.js";

let accessToken: string | null = null;
let tokenExpiration: number | null = null;

/**
 * Retrieves an OAuth2 access token using client credentials.
 * Caches the token until it expires.
 */
async function getAccessToken(): Promise<string | null> {
    if (accessToken && tokenExpiration && Date.now() < tokenExpiration) {
        return accessToken;
    }

    const authHeader = `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`;

    try {
        const response = await fetch(`${AUDIENSE_API_BASE}/login/token`, {
            method: "POST",
            headers: {
                Authorization: authHeader,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
        });

        if (!response.ok) {
            console.error("Authentication error:", await response.text());
            throw new Error(`Authentication error: ${response.status}`);
        }

        const data = (await response.json()) as AuthResponse;
        accessToken = data.access_token;
        tokenExpiration = Date.now() + data.expires_in * 1000;

        return accessToken;
    } catch (error) {
        console.error("Error retrieving access token:", error);
        return null;
    }
}

/**
 * Makes an authenticated request to the Audiense API.
 * Automatically retrieves and refreshes the access token if needed.
 */
async function makeAudienseRequest<T>(endpoint: string): Promise<T | null> {
    const token = await getAccessToken();
    if (!token) {
        console.error("Failed to retrieve access token.");
        return null;
    }

    const url = `${AUDIENSE_API_BASE}${endpoint}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            console.error(`Request error ${response.status} for ${endpoint}:`, await response.text());
            return null;
        }

        return (await response.json()) as T;
    } catch (error) {
        console.error(`Request error for ${endpoint}:`, error);
        return null;
    }
}

/**
 * Retrieves the list of intelligence reports.
 */
export async function getIntelligenceReports(): Promise<IntelligenceReportsResponse | null> {
    return makeAudienseRequest<IntelligenceReportsResponse>("/reports/intelligence");
}

/**
 * Retrieves details of a specific intelligence report.
 */
export async function getReportInfo(report_id: string): Promise<ReportInfoResponse | null> {
    return makeAudienseRequest<ReportInfoResponse>(`/reports/intelligence/${report_id}`);
}

/**
 * Retrieves audience insights for a given audience_insights_id.
 * If `insights` is provided, filters by those insights.
 */
export async function getAudienceInsights(
    audience_insights_id: string,
    insights?: string[]
): Promise<{ insights: { name: string; values: { key: string; value: string }[] }[] } | null> {
    const queryParams = insights ? `?insights=${insights.join(",")}` : "";
    return makeAudienseRequest<{ insights: { name: string; values: { key: string; value: string }[] }[] }>(
        `/audience_insights/${audience_insights_id}${queryParams}`
    );
}


type TwitterUser = {
    id: string;
    description?: string;
    is_identity_verified?: boolean;
    location?: string;
    name?: string;
    parody?: boolean;
    profile_image_url?: string;
    protected?: boolean;
    public_metrics?: Record<string, number>;
    url?: string;
    username?: string;
    verified?: boolean;
    verified_followers_count?: number;
    verified_type?: string;
};

type TwitterAPIResponse = {
    data?: TwitterUser[];
};

/**
 * Fetches Twitter user details for up to 100 user IDs.
 */
async function fetchTwitterUserDetails(userIds: string[]): Promise<Record<string, TwitterUser>> {
    if (!TWITTER_BEARER_TOKEN) {
        console.error("Missing Twitter/X Bearer Token. Skipping Twitter/X enrichment.");
        return {};
    }

    const idsParam = userIds.join(",");
    const userFields = [
        "description",
        "is_identity_verified",
        "location",
        "name",
        "parody",
        "profile_image_url",
        "protected",
        "public_metrics",
        "url",
        "username",
        "verified",
        "verified_followers_count",
        "verified_type"
    ].join(",");

    const url = `${TWITTER_API_BASE}/users?ids=${idsParam}&user.fields=${userFields}`;

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${TWITTER_BEARER_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.error("Twitter API error:", await response.text());
            return {};
        }

        const data = (await response.json()) as TwitterAPIResponse;

        if (!data.data) return {};

        return Object.fromEntries(data.data.map((user) => [user.id, user]));
    } catch (error) {
        console.error("Error fetching Twitter user details:", error);
        return {};
    }
}

/**
 * Compares the influencers of an audience with those of a baseline, enriched with Twitter user details.
 */
export async function compareAudienceInfluencers(
    audience_influencers_id: string,
    baseline_audience_influencers_id: string,
    cursor?: number,
    count?: number,
    bio_keyword?: string,
    entity_type?: "person" | "brand",
    followers_min?: number,
    followers_max?: number,
    categories?: string[],
    countries?: string[]
): Promise<{ cursor: { next: number; prev: number }; influencers: any[] } | null> {
    const queryParams = new URLSearchParams();

    if (cursor !== undefined) queryParams.append("cursor", cursor.toString());
    if (count !== undefined) queryParams.append("count", count.toString());
    if (bio_keyword) queryParams.append("bio_keyword", bio_keyword);
    if (entity_type) queryParams.append("entity_type", entity_type);
    if (followers_min !== undefined) queryParams.append("followers_min", followers_min.toString());
    if (followers_max !== undefined) queryParams.append("followers_max", followers_max.toString());
    if (categories && categories.length > 0) queryParams.append("categories", categories.join(","));
    if (countries && countries.length > 0) queryParams.append("countries", countries.join(","));

    const endpoint = `/audience_influencers/${audience_influencers_id}/compared_to/${baseline_audience_influencers_id}?${queryParams.toString()}`;

    const data = await makeAudienseRequest<{ cursor: { next: number; prev: number }; influencers: { id: string; affinity: number; baseline_affinity: number; uniqueness: number }[] }>(endpoint);

    if (!data || !data.influencers.length) {
        return data;
    }

    // Get the first 100 influencers for enrichment
    const influencerIds = data.influencers.slice(0, 100).map((influencer) => influencer.id);
    const twitterData = await fetchTwitterUserDetails(influencerIds);

    // Merge Twitter details into influencer data
    const enrichedInfluencers = data.influencers.map((influencer) => ({
        ...influencer,
        twitter: twitterData[influencer.id] || null, // Add Twitter data if available
    }));

    return {
        cursor: data.cursor,
        influencers: enrichedInfluencers,
    };
}

/**
 * Retrieves the relevant content that an audience engages with.
 */
export async function getAudienceContent(audience_content_id: string): Promise<{
    createdAt: string;
    startDate: string;
    endDate: string;
    status: string;
    likedContent: any;
    sharedContent: any;
    influentialContent: any;
} | null> {
    return makeAudienseRequest<{
        createdAt: string;
        startDate: string;
        endDate: string;
        status: string;
        likedContent: any;
        sharedContent: any;
        influentialContent: any;
    }>(`/audience_content/${audience_content_id}`);
}
