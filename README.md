# 🏆 Audiense Insights MCP Server
[![smithery badge](https://smithery.ai/badge/@AudienseCo/mcp-audiense-insights)](https://smithery.ai/server/@AudienseCo/mcp-audiense-insights)

This server, based on the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol), allows **Claude** or any other MCP-compatible client to interact with your [Audiense Insights](https://www.audiense.com/) account. It extracts **marketing insights and audience analysis** from Audiense reports, covering **demographic, cultural, influencer, and content engagement analysis**.

---

## 🚀 Prerequisites

Before using this server, ensure you have:

- **Node.js** (v16 or higher)
- **Claude Desktop App**
- **Audiense Insights Account** with API credentials
- **X/Twitter API Bearer Token** _(optional, for enriched influencer data)_

---

## ⚙️ Configuring Claude Desktop

1. Open the configuration file for Claude Desktop:

   - **MacOS:**
     ```bash
     code ~/Library/Application\ Support/Claude/claude_desktop_config.json
     ```
   - **Windows:**
     ```bash
     code %AppData%\Claude\claude_desktop_config.json
     ```

2. Add or update the following configuration:

   ```json
   "mcpServers": {
     "audiense-insights": {
       "command": "/opt/homebrew/bin/node",
       "args": [
         "/ABSOLUTE/PATH/TO/YOUR/build/index.js"
       ],
       "env": {
         "AUDIENSE_CLIENT_ID": "your_client_id_here",
         "AUDIENSE_CLIENT_SECRET": "your_client_secret_here",
         "TWITTER_BEARER_TOKEN": "your_token_here"
       }          
     }     
   }

	3.	Save the file and restart Claude Desktop.

## 🛠️ Available Tools

**get-reports**
- Description: Lists all intelligence reports available for the authenticated user.
- Parameters: (None)
- Use case: Start here to discover available audience analyses.

**get-report-info**
- Description: Retrieves detailed information about a specific intelligence report, including its status, segmentation type, audience size, segments, and access links.
- Required Parameter: report_id (string)
- Use case: Understand the scope and segmentation of an audience report.

**get-audience-insights**
- Description: Retrieves aggregated insights for a given audience ID, providing statistical distributions across various attributes:
    - Demographics: Gender, age, country.
    - Behavioral Traits: Active hours, platform usage.
    - Psychographics: Personality traits, interests.
    - Socioeconomic Factors: Income, education level.
    - Required Parameter: audience_insights_id (string)
    - Optional Parameter: insights (array of strings) → Filters insights.
- Use case: Gain a detailed understanding of audience characteristics.

**compare-audience-influencers**
- Description: Compares the influencers of an audience with a baseline audience.
- Baseline Rules:
    - If the audience is global, the baseline is global.
    - If a single country represents ≥50%, that country is used as the baseline.
    - If a segment is selected, the full audience is the baseline.
- Each comparison includes:
    - Affinity (%) → How closely the influencer aligns with the audience.
    - Baseline Affinity (%) → The influencer’s affinity in the baseline.
    - Uniqueness Score → How distinct the influencer is in this audience vs. the baseline.
- Required Parameters:
    - audience_influencers_id (string)
    - baseline_audience_influencers_id (string)
- Optional Filters:
    - cursor (number, pagination)
    - count (number, default: 200)
    - bio_keyword (string, filter by biography content)
    - entity_type (person/brand)
    - followers_min/max (number)
    - categories (array of strings)
    - countries (array of strings)
- Use case: Compare key influencers against a reference audience.

**get-audience-content**
- Description: Retrieves content engagement insights for an audience.
- Categories:
    - Liked Content → Popular posts, top domains, hashtags, links, emojis.
    - Shared Content → Most shared posts, domains, links, media.
    - Influential Content → Key influential accounts for the audience.
- Each category includes:
    - popularPost, topDomains, topEmojis, topHashtags, topLinks, topMedia, wordcloud
- Required Parameter: audience_content_id (string)
- Use case: Analyze the content most relevant to an audience.

**get-baselines**
- Description: Retrieves available baseline audiences, optionally filtered by country.
- Optional Parameter: country (string, ISO country code)
- Use case: Determine the best reference audience for comparisons.

**get-categories**
- Description: Retrieves the list of available affinity categories for filtering influencer comparisons.
- Parameters: (None)
- Use case: Use categories to refine influencer analysis.

## 💡 Predefined Prompts

This server includes a preconfigured prompt called `audiense-demo`, which helps analyze Audiense reports interactively.

**Usage:**
- Accepts a reportName argument to find the most relevant report.
- If an ID is provided, it searches by report ID instead.

Use case: Structured guidance for audience analysis.

## 🛠️ Troubleshooting

### Tools Not Appearing in Claude
1.	Check Claude Desktop logs:

```
tail -f ~/Library/Logs/Claude/mcp*.log
```
2.	Verify environment variables are set correctly.
3.	Ensure the absolute path to index.js is correct.

### Authentication Issues
- Double-check OAuth credentials.
- Ensure the refresh token is still valid.
- Verify that the required API scopes are enabled.

## 📜 Viewing Logs

To check server logs:

### For MacOS/Linux:
```
tail -n 20 -f ~/Library/Logs/Claude/mcp*.log
```

### For Windows:
```
Get-Content -Path "$env:AppData\Claude\Logs\mcp*.log" -Wait -Tail 20
```

## 🔐 Security Considerations

- Keep API credentials secure – never expose them in public repositories.
- Use environment variables to manage sensitive data.

## 📄 License

This project is licensed under the Apache 2.0 License. See the LICENSE file for more details.
