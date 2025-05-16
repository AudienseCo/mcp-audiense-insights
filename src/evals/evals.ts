//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const getReportsEval: EvalFunction = {
    name: "get-reports",
    description: "Evaluates the retrieval of Audiense insights reports for the authenticated user",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please retrieve my Audiense insights reports.");
        return JSON.parse(result);
    }
};

const getReportInfoEval: EvalFunction = {
    name: "get-report-info Evaluation",
    description: "Evaluates the retrieval of intelligence report information by ID",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Retrieve the details of the intelligence report with ID 12345, including status, segmentation type, audience size, segments, and access links.");
        return JSON.parse(result);
    }
};

const getAudienceInsightsEval: EvalFunction = {
    name: "get-audience-insights",
    description: "Evaluates retrieval of aggregated insights for a specific audience ID",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please retrieve aggregated insights for audience ID 'aud123' focusing on demographics and behavioral traits.");
        return JSON.parse(result);
    }
};

const getBaselinesToolEvaluation: EvalFunction = {
    name: 'Get Baselines Tool Evaluation',
    description: 'Evaluates the retrieval of available baselines with optional country filtering',
    run: async () => {
        const result = await grade(openai("gpt-4"), "What baselines are available for the US?");
        return JSON.parse(result);
    }
};

const getCategoriesEval: EvalFunction = {
    name: 'get-categories Tool Evaluation',
    description: 'Evaluates retrieval of the list of available affinity categories for compare-audience-influencers',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Which categories can be used with the compare-audience-influencers tool?");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [getReportsEval, getReportInfoEval, getAudienceInsightsEval, getBaselinesToolEvaluation, getCategoriesEval]
};
  
export default config;
  
export const evals = [getReportsEval, getReportInfoEval, getAudienceInsightsEval, getBaselinesToolEvaluation, getCategoriesEval];