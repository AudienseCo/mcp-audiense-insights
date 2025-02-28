import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getIntelligenceReports, getReportInfo, getAudienceInsights, compareAudienceInfluencers, getAudienceContent } from "./audienseClient.js";
import { BASELINES } from "./baselines.js";
import { CATEGORIES } from "./categories.js";
import { DEMO_PROMPT, DEMO_PROMPT2, SEGMENT_MATCHING_PROMPT } from "./promts.js";
import { generateReportSummary } from "./reportSummary.js";

// MCP Server instance
const server = new McpServer({
    name: "audiense-insights",
    version: "1.0.0",
});

/**
 * MCP Tool: Fetches a list of intelligence reports for the authenticated user.
 */
server.tool(
    "get-reports",
    "Retrieves the list of Audiense insights reports owned by the authenticated user.",
    {},
    async () => {
        const data = await getIntelligenceReports();

        if (!data) {
            return {
                content: [
                    {
                        type: "text",
                        text: "Failed to retrieve intelligence reports.",
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                },
            ],
        };
    }
);

/**
 * MCP Tool: Fetches details of a specific intelligence report.
 */
server.tool(
    "get-report-info",
    "Retrieves detailed information about a specific intelligence report, including its status, segmentation type, audience size, segments, and access links.",
    {
        report_id: z.string().describe("The ID of the intelligence report."),
    },
    async ({ report_id }) => {
        const data = await getReportInfo(report_id);

        if (!data) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve report info for ID: ${report_id}.`,
                    },
                ],
            };
        }

        if (data.status === "pending") {
            return {
                content: [
                    {
                        type: "text",
                        text: `Report ${report_id} is still processing. Try again later.`,
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }
            ]
        };
    }
);

/**
 * MCP Tool: Fetches aggregated insights for a given audience ID.
 */
server.tool(
    "get-audience-insights",
    `Retrieves aggregated insights for a given audience ID, providing statistical distributions across various attributes.
    Available insights include demographics (e.g., gender, age, country), behavioral traits (e.g., active hours, platform usage), psychographics (e.g., personality traits, interests), and socioeconomic factors (e.g., income, education status).`,
    {
        audience_insights_id: z.string().describe("The ID of the audience insights."),
        insights: z.array(z.string()).optional().describe("Optional list of insight names to filter."),
    },
    async ({ audience_insights_id, insights }) => {
        const data = await getAudienceInsights(audience_insights_id, insights);

        if (!data || !data.insights.length) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No insights found for audience ${audience_insights_id}.`,
                    },
                ],
            };
        }

        const insightsText = data.insights
            .map(
                (insight) =>
                    `**${insight.name}**:\n${insight.values
                        .map((val) => `- ${val.key}: ${val.value}%`)
                        .join("\n")}`
            )
            .join("\n\n");

        return {
            content: [
                {
                    type: "text",
                    text: `Audience Insights for ${audience_insights_id}:\n\n${insightsText}`,
                },
            ],
        };
    }
);

server.tool(
    "get-baselines",
    "Retrieves available baselines, optionally filtered by country.",
    {
        country: z.string().optional().describe("ISO country code to filter by.")
    },
    async ({ country }) => {
        let filteredBaselines = BASELINES;

        // Apply country filter if provided
        if (country) {
            filteredBaselines = filteredBaselines.filter(
                (baseline) => baseline.country_iso_code === country
            );
        }

        if (filteredBaselines.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No baselines found for the given filters.`,
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(filteredBaselines, null, 2),
                },
            ],
        };
    }
);

server.tool(
    "get-categories",
    "Retrieves the list of available affinity categories that can be used as the categories parameter in the compare-audience-influencers tool.",
    {},
    async () => {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(CATEGORIES, null, 2),
                },
            ],
        };
    }
);

server.tool(
    "compare-audience-influencers",
    `Compares the influencers of an audience with a baseline audience. The baseline is determined as follows: 
    If the selection was the full audience and a single country represents more than 50% of the audience, that country is used as the baseline.
    Otherwise, the Global baseline is applied. If the selection was a specific segment, the full audience is used as the baseline.
    Each influencer comparison includes: 
        - Affinity (%) - The level of alignment between the influencer and the audience. Baseline Affinity (%)
        - The influencer’s affinity within the baseline audience. Uniqueness Score
        - A measure of how distinct the influencer is within the selected audience compared to the baseline.
    `,
    {
        audience_influencers_id: z.string().describe("The ID of the audience influencers."),
        baseline_audience_influencers_id: z.string().describe("The ID of the baseline audience influencers."),
        cursor: z.number().optional().describe("Cursor for pagination."),
        count: z.number().optional().describe("Number of items per page (default: 200)."),
        bio_keyword: z.string().optional().describe("Keyword to filter influencers by their biography."),
        entity_type: z.enum(["person", "brand"]).optional().describe("Filter by entity type (person or brand)."),
        followers_min: z.number().optional().describe("Minimum number of followers."),
        followers_max: z.number().optional().describe("Maximum number of followers."),
        categories: z.array(z.string()).optional().describe("Filter influencers by categories."),
        countries: z.array(z.string()).optional().describe("Filter influencers by country ISO codes."),
    },
    async ({ audience_influencers_id, baseline_audience_influencers_id, cursor, count, bio_keyword, entity_type, followers_min, followers_max, categories, countries }) => {
        const data = await compareAudienceInfluencers(
            audience_influencers_id,
            baseline_audience_influencers_id,
            cursor,
            count,
            bio_keyword,
            entity_type,
            followers_min,
            followers_max,
            categories,
            countries
        );

        if (!data || !data.influencers.length) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No influencers found for comparison between ${audience_influencers_id} and ${baseline_audience_influencers_id}.`,
                    },
                ],
            };
        }

        const influencersText = data.influencers
            .map(
                (influencer) =>
                    `ID: ${influencer.id}\nAffinity: ${influencer.affinity}%\nBaseline Affinity: ${influencer.baseline_affinity}%\nUniqueness: ${influencer.uniqueness}%`
            )
            .join("\n\n");

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
);

server.tool(
    "get-audience-content",
    `Retrieves audience content engagement details for a given audience.

This tool provides a detailed breakdown of the content an audience interacts with, including:
- **Liked Content**: Popular posts, top domains, top emojis, top hashtags, top links, top media, and a word cloud.
- **Shared Content**: Content that the audience shares, categorized similarly to liked content.
- **Influential Content**: Content from influential accounts that impact the audience, with similar categorization.

Each category contains:
- **popularPost**: List of the most engaged posts.
- **topDomains**: Most mentioned domains.
- **topEmojis**: Most used emojis.
- **topHashtags**: Most used hashtags.
- **topLinks**: Most shared links.
- **topMedia**: Media types shared and samples.
- **wordcloud**: Frequently used words.`,
    {
        audience_content_id: z.string().describe("The ID of the audience content to retrieve."),
    },
    async ({ audience_content_id }) => {
        const data = await getAudienceContent(audience_content_id);

        if (!data) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No content found for audience ${audience_content_id}.`,
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2),
                },
            ],
        };
    }
);


server.prompt(
    "audiense-demo",
    "A prompt to extract marketing insights and audience understanding from Audiense reports through demographic, cultural, influencer, and content analysis.",
    { reportName: z.string().describe("The name or id of the Audiense Insights report.") },
    ({ reportName }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: DEMO_PROMPT.replaceAll('{reportName}', reportName)
        }
      }]
    })
);

server.prompt(
    "audiense-demo2",
    "A prompt to extract marketing insights and audience understanding from Audiense reports through demographic, cultural, influencer, and content analysis.",
    { reportName: z.string().describe("The name or id of the Audiense Insights report.") },
    ({ reportName }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: DEMO_PROMPT2.replaceAll('{reportName}', reportName)
        }
      }]
    })
);

server.prompt(
    "segment-matching",
    "A prompt to match and compare audience segments across Audiense reports, identifying similarities, unique traits, and key insights based on demographics, interests, influencers, and engagement patterns.",
    { 
        brand1: z.string().describe("The name or ID of the Audiense Insights report for the first brand to analyze."),
        brand2: z.string().describe("The name or ID of the Audiense Insights report for the second brand to analyze.")
    },
    ({ brand1, brand2 }) => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: SEGMENT_MATCHING_PROMPT
            .replaceAll('{brand1}', brand1)
            .replaceAll('{brand2}', brand2)
        }
      }]
    })
);

/**
 * MCP Tool: Generates a comprehensive summary of an Audiense report
 */
server.tool(
    "report-summary",
    "Generates a comprehensive summary of an Audiense report, including segment details, top insights, and influencers.",
    {
        report_id: z.string().describe("The ID of the intelligence report to summarize."),
    },
    async ({ report_id }) => {
        const data = await generateReportSummary(report_id);

        if (!data) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to generate summary for report ID: ${report_id}.`,
                    },
                ],
            };
        }

        if (data.message) {
            return {
                content: [
                    {
                        type: "text",
                        text: data.message,
                    },
                ],
            };
        }

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(data, null, 2)
                }
            ]
        };
    }
);

/**
 * Starts the MCP server and listens for incoming requests.
 */
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Audiense Insights MCP Server running on stdio");
}

runServer().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
