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
    full_audience?: { size?: number };
    segments?: { id: string; title: string; size: number }[];
    public: boolean;
    links?: { app?: string; public?: string };
    errors?: string[];
};