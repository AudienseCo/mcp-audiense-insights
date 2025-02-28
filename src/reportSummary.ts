import { getReportInfo, getAudienceInsights, compareAudienceInfluencers } from "./audienseClient.js";
import { InsightValue, ReportSummaryResponse } from "./types.js";

/**
 * Fetches the top N values for each insight type
 * @param audienceId The audience ID to fetch insights for
 * @param insightTypes Array of insight types to fetch
 * @param topCount Number of top values to return for each insight
 * @returns Record of insight types to their top values or null
 */
async function getTopInsights(
    audienceId: string,
    insightTypes: string[],
    topCount: number = 5
): Promise<Record<string, InsightValue[] | null>> {
    try {
        const insightsData = await getAudienceInsights(audienceId, insightTypes);
        
        if (!insightsData || !insightsData.insights.length) {
            console.error(`No insights found for audience ${audienceId} and insight types ${insightTypes.join(',')}`);
            return Object.fromEntries(insightTypes.map(type => [type, null]));
        }

        // Process each insight type
        const result: Record<string, InsightValue[] | null> = {};
        
        for (const insight of insightsData.insights) {
            // Sort values by percentage (descending) and take top N
            result[insight.name] = insight.values
                .sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
                .slice(0, topCount)
                .map(v => ({ key: v.key, value: parseFloat(v.value) }));
        }
        
        return result;
    } catch (error) {
        console.error(`Error fetching insights for audience ${audienceId}:`, error);
        return Object.fromEntries(insightTypes.map(type => [type, null]));
    }
}

/**
 * Fetches top influencers for a segment compared to the full audience
 * @param segmentId The segment ID to fetch influencers for
 * @param fullAudienceId The full audience ID for comparison
 * @param count Number of influencers to return
 * @returns Array of influencers or null if error
 */
async function getTopInfluencers(
    segmentId: string,
    baselineAudienceId: string,
    count: number = 10
): Promise<any[] | null> {
    try {
        const influencersData = await compareAudienceInfluencers(
            segmentId,
            baselineAudienceId,
            undefined, // cursor
            count      // count
        );

        if (!influencersData || !influencersData.influencers.length) {
            console.error(`No influencers found for segment ${segmentId}`);
            return null;
        }

        // Filter influencers to include only the specified fields
        return influencersData.influencers.map(influencer => ({
            id: influencer.id,
            affinity: influencer.affinity,
            baseline_affinity: influencer.baseline_affinity,
            uniqueness: influencer.uniqueness,
            followers_count: influencer.twitter?.public_metrics?.followers_count,
            url: influencer.twitter?.url,
            name: influencer.twitter?.name,
            verified_type: influencer.twitter?.verified_type,
            description: influencer.twitter?.description,
            profile_image_url: influencer.twitter?.profile_image_url,
            verified: influencer.twitter?.verified,
            username: influencer.twitter?.username
        }));
    } catch (error) {
        console.error(`Error fetching influencers for segment ${segmentId}:`, error);
        return null;
    }
}

/**
 * Generates a comprehensive summary of an Audiense report
 * @param reportId The ID of the report to summarize
 * @returns A structured summary of the report or null if error
 */
export async function generateReportSummary(reportId: string): Promise<ReportSummaryResponse | null> {
    const insightTypes = ['bio_keyword', 'country', 'age', 'city', 'language', 'gender', 'interest'];
    
    try {
        // Fetch the report info
        const reportInfo = await getReportInfo(reportId);
        
        if (!reportInfo) {
            console.error(`Failed to retrieve report info for ID: ${reportId}`);
            return null;
        }

        if (reportInfo.status === "pending") {
            return {
                title: reportInfo.title,
                status: reportInfo.status,
                message: "Report is still processing. Try again later."
            };
        }

        if (!reportInfo.segments || reportInfo.segments.length === 0) {
            return {
                title: reportInfo.title,
                status: reportInfo.status,
                message: "Report has no segments to analyze."
            };
        }

        // Get the full audience ID for influencer comparison
        const fullAudienceId = reportInfo.full_audience?.audience_influencers_id;

        // Process all segments in parallel
        const segmentPromises = reportInfo.segments.map(async segment => {
            const segmentInfluencersId = segment.audience_influencers_id;
            
            // Only attempt to get influencers if we have valid IDs
            const influencers = fullAudienceId && segmentInfluencersId ? 
                await getTopInfluencers(segmentInfluencersId, fullAudienceId) : 
                null;
            const insights = await getTopInsights(segment.id, insightTypes);
        
            return {
                id: segment.id,
                title: segment.title,
                size: segment.size,
                insights,
                influencers
            };
        });

        const segments = await Promise.all(segmentPromises);

        // Return the complete report summary
        return {
            id: reportId,
            title: reportInfo.title,
            segmentation_type: reportInfo.segmentation_type,
            full_audience_size: reportInfo.full_audience?.size,
            segments,
            links: reportInfo.links
        };
    } catch (error) {
        console.error(`Error generating report summary for ${reportId}:`, error);
        return null;
    }
}
