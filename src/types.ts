export type AuthResponse = {
    access_token: string;
    expires_in: number;
};

export type IntelligenceReport = {
    id: string;
    title: string;
    segmentation_type: string;
    created_at: string;
    status: string;
};

export type IntelligenceReportsResponse = {
    reports: IntelligenceReport[];
    cursor: {
        cursor: {
            next: number;
            prev: number;
        };
    };
};

export type ReportInfoResponse = {
    title: string;
    status: string;
    segmentation_type: string;
    full_audience?: { 
        size?: number;
        audience_influencers_id?: string;
    };
    segments?: { 
        id: string; 
        title: string; 
        size: number;
        audience_influencers_id?: string;
    }[];
    audience_influencers_id?: string;
    public: boolean;
    links?: { app?: string; public?: string };
    errors?: string[];
};

export type InsightValue = {
    key: string;
    value: number;
};

export type SegmentSummary = {
    id: string;
    title: string;
    size: number;
    insights: Record<string, InsightValue[] | null>;
    influencers: any[] | null;
};

export type ReportSummaryResponse = {
    id?: string;
    title: string;
    status?: string;
    segmentation_type?: string;
    full_audience_size?: number;
    segments?: SegmentSummary[];
    links?: { app?: string; public?: string };
    message?: string;
};
