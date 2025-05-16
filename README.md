# 🏆 Audiense Insights MCP Server

This server, based on the [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol), allows **Claude** or any other MCP-compatible client to interact with your [Audiense Insights](https://www.audiense.com/) account. It extracts **marketing insights and audience analysis** from Audiense reports, covering **demographic, cultural, influencer, and content engagement analysis**.
---

## 🚀 Prerequisites

Before using this server, ensure you have:

- **Node.js** (v18 or higher)
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
       "command": "npx",
       "args": [
        "-y",
         "mcp-audiense-insights"
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
### 📌 `get-reports`
**Description**: Retrieves the list of **Audiense insights reports** owned by the authenticated user.

- **Parameters**: _None_
- **Response**:
  - List of reports in JSON format.

---

### 📌 `get-report-info`
**Description**: Fetches detailed information about a **specific intelligence report**, including:
  - Status
  - Segmentation type
  - Audience size
  - Segments
  - Access links

- **Parameters**:
  - `report_id` _(string)_: The ID of the intelligence report.

- **Response**:
  - Full report details in JSON format.
  - If the report is still processing, returns a message indicating the pending status.

---

### 📌 `get-audience-insights`
**Description**: Retrieves **aggregated insights** for a given **audience**, including:
  - **Demographics**: Gender, age, country.
  - **Behavioral traits**: Active hours, platform usage.
  - **Psychographics**: Personality traits, interests.
  - **Socioeconomic factors**: Income, education status.

- **Parameters**:
  - `audience_insights_id` _(string)_: The ID of the audience insights.
  - `insights` _(array of strings, optional)_: List of specific insight names to filter.

- **Response**:
  - Insights formatted as a structured text list.

---

### 📌 `get-baselines`
**Description**: Retrieves available **baseline audiences**, optionally filtered by **country**.

- **Parameters**:
  - `country` _(string, optional)_: ISO country code to filter by.

- **Response**:
  - List of baseline audiences in JSON format.

---

### 📌 `get-categories`
**Description**: Retrieves the list of **available affinity categories** that can be used in influencer comparisons.

- **Parameters**: _None_
- **Response**:
  - List of categories in JSON format.

---

### 📌 `compare-audience-influencers`
**Description**: Compares **influencers** of a given audience with a **baseline audience**. The baseline is determined as follows:
  - If a **single country** represents more than 50% of the audience, that country is used as the baseline.
  - Otherwise, the **global baseline** is used.
  - If a **specific segment** is selected, the full audience is used as the baseline.

Each influencer comparison includes:
  - **Affinity (%)** – How well the influencer aligns with the audience.
  - **Baseline Affinity (%)** – The influencer’s affinity within the baseline audience.
  - **Uniqueness Score** – How distinct the influencer is compared to the baseline.

- **Parameters**:
  - `audience_influencers_id` _(string)_: ID of the audience influencers.
  - `baseline_audience_influencers_id` _(string)_: ID of the baseline audience influencers.
  - `cursor` _(number, optional)_: Pagination cursor.
  - `count` _(number, optional)_: Number of items per page (default: 200).
  - `bio_keyword` _(string, optional)_: Filter influencers by **bio keyword**.
  - `entity_type` _(enum: `person` | `brand`, optional)_: Filter by entity type.
  - `followers_min` _(number, optional)_: Minimum number of followers.
  - `followers_max` _(number, optional)_: Maximum number of followers.
  - `categories` _(array of strings, optional)_: Filter influencers by **categories**.
  - `countries` _(array of strings, optional)_: Filter influencers by **country ISO codes**.

- **Response**:
  - List of influencers with **affinity scores, baseline comparison, and uniqueness scores** in JSON format.

---

### 📌 `get-audience-content`
**Description**: Retrieves **audience content engagement details**, including:
  - **Liked Content**: Most popular posts, domains, emojis, hashtags, links, media, and a word cloud.
  - **Shared Content**: Most shared content categorized similarly.
  - **Influential Content**: Content from influential accounts.

Each category contains:
  - `popularPost`: Most engaged posts.
  - `topDomains`: Most mentioned domains.
  - `topEmojis`: Most used emojis.
  - `topHashtags`: Most used hashtags.
  - `topLinks`: Most shared links.
  - `topMedia`: Shared media.
  - `wordcloud`: Most frequently used words.

- **Parameters**:
  - `audience_content_id` _(string)_: The ID of the audience content.

- **Response**:
  - Content engagement data in JSON format.

---

### 📌 `report-summary`
**Description**: Generates a **comprehensive summary** of an Audiense report, including:
  - Report metadata (title, segmentation type)
  - Full audience size
  - Detailed segment information
  - **Top insights** for each segment (bio keywords, demographics, interests)
  - **Top influencers** for each segment with comparison metrics

- **Parameters**:
  - `report_id` _(string)_: The ID of the intelligence report to summarize.

- **Response**:
  - Complete report summary in JSON format with structured data for each segment
  - For pending reports: Status message indicating the report is still processing
  - For reports without segments: Message indicating there are no segments to analyze

## 💡 Predefined Prompts

This server includes a preconfigured prompts
- `audiense-demo`: Helps analyze Audiense reports interactively.
- `segment-matching`: A prompt to match and compare audience segments across Audiense reports, identifying similarities, unique traits, and key insights based on demographics, interests, influencers, and engagement patterns.


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


## Running evals

The evals package loads an mcp client that then runs the index.ts file, so there is no need to rebuild between tests. You can load environment variables by prefixing the npx command. Full documentation can be found [here](https://www.mcpevals.io/docs).

```bash
OPENAI_API_KEY=your-key  npx mcp-eval src/evals/evals.ts src/index.ts
```