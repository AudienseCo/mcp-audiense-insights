import { generateReportSummary } from '../reportSummary.js';
import { getReportInfo, getAudienceInsights, compareAudienceInfluencers } from '../audienseClient.js';
import { ReportInfoResponse } from '../types.js';

// Mock the audienseClient functions
jest.mock('../audienseClient.js', () => ({
    getReportInfo: jest.fn(),
    getAudienceInsights: jest.fn(),
    compareAudienceInfluencers: jest.fn()
}));

describe('Report Summary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should handle pending reports', async () => {
        // Mock a pending report
        (getReportInfo as jest.Mock).mockResolvedValue({
            title: 'Test Report',
            status: 'pending',
            segmentation_type: 'test'
        } as ReportInfoResponse);

        const result = await generateReportSummary('test-report-id');
        
        expect(result).toEqual({
            title: 'Test Report',
            status: 'pending',
            message: 'Report is still processing. Try again later.'
        });
        expect(getReportInfo).toHaveBeenCalledWith('test-report-id');
    });

    it('should handle reports with no segments', async () => {
        // Mock a report with no segments
        (getReportInfo as jest.Mock).mockResolvedValue({
            title: 'Test Report',
            status: 'completed',
            segmentation_type: 'test',
            segments: [],
            public: false
        } as ReportInfoResponse);

        const result = await generateReportSummary('test-report-id');
        
        expect(result).toEqual({
            title: 'Test Report',
            status: 'completed',
            message: 'Report has no segments to analyze.'
        });
    });

    it('should generate a complete report summary', async () => {
        // Mock report info
        (getReportInfo as jest.Mock).mockResolvedValue({
            title: 'Test Report',
            status: 'completed',
            segmentation_type: 'test',
            full_audience: {
                size: 1000,
                audience_influencers_id: 'full-audience-id'
            },
            public: false,
            segments: [
                {
                    id: 'segment-1',
                    title: 'Segment 1',
                    size: 500,
                    audience_influencers_id: 'segment-1-influencers'
                },
                {
                    id: 'segment-2',
                    title: 'Segment 2',
                    size: 500,
                    audience_influencers_id: 'segment-2-influencers'
                }
            ],
            links: {
                app: 'https://app.example.com/report',
                public: 'https://public.example.com/report'
            }
        } as ReportInfoResponse);

        // Mock insights for segment 1
        (getAudienceInsights as jest.Mock).mockImplementation((audienceId, insights) => {
            if (audienceId === 'segment-1') {
                return {
                    insights: [
                        {
                            name: 'bio_keyword',
                            values: [
                                { key: 'tech', value: '30' },
                                { key: 'marketing', value: '20' },
                                { key: 'design', value: '15' },
                                { key: 'developer', value: '10' },
                                { key: 'product', value: '5' }
                            ]
                        },
                        {
                            name: 'country',
                            values: [
                                { key: 'US', value: '40' },
                                { key: 'UK', value: '20' },
                                { key: 'Canada', value: '15' },
                                { key: 'Germany', value: '10' },
                                { key: 'France', value: '5' }
                            ]
                        }
                    ]
                };
            } else if (audienceId === 'segment-2') {
                return {
                    insights: [
                        {
                            name: 'bio_keyword',
                            values: [
                                { key: 'finance', value: '35' },
                                { key: 'business', value: '25' },
                                { key: 'entrepreneur', value: '15' },
                                { key: 'investor', value: '10' },
                                { key: 'startup', value: '5' }
                            ]
                        },
                        {
                            name: 'country',
                            values: [
                                { key: 'US', value: '30' },
                                { key: 'India', value: '25' },
                                { key: 'UK', value: '15' },
                                { key: 'Australia', value: '10' },
                                { key: 'Singapore', value: '5' }
                            ]
                        }
                    ]
                };
            }
            return { insights: [] };
        });

        // Mock influencers
        (compareAudienceInfluencers as jest.Mock).mockImplementation((segmentId, baselineId) => {
            if (segmentId === 'segment-1-influencers') {
                return {
                    cursor: { next: 10, prev: 0 },
                    influencers: [
                        { id: 'inf-1', affinity: 80, baseline_affinity: 30, uniqueness: 50 },
                        { id: 'inf-2', affinity: 75, baseline_affinity: 25, uniqueness: 50 }
                    ]
                };
            } else if (segmentId === 'segment-2-influencers') {
                return {
                    cursor: { next: 10, prev: 0 },
                    influencers: [
                        { id: 'inf-3', affinity: 85, baseline_affinity: 35, uniqueness: 50 },
                        { id: 'inf-4', affinity: 70, baseline_affinity: 20, uniqueness: 50 }
                    ]
                };
            }
            return { cursor: { next: 0, prev: 0 }, influencers: [] };
        });

        const result = await generateReportSummary('test-report-id');
        
        // Verify the structure of the result
        expect(result).toHaveProperty('id', 'test-report-id');
        expect(result).toHaveProperty('title', 'Test Report');
        expect(result).toHaveProperty('segmentation_type', 'test');
        expect(result).toHaveProperty('full_audience_size', 1000);
        expect(result).toHaveProperty('segments');
        expect(result?.segments).toHaveLength(2);
        
        // Check first segment
        const segment1 = result?.segments?.[0];
        expect(segment1).toHaveProperty('id', 'segment-1');
        expect(segment1).toHaveProperty('title', 'Segment 1');
        expect(segment1).toHaveProperty('size', 500);
        expect(segment1).toHaveProperty('insights');
        expect(segment1).toHaveProperty('influencers');
        
        // Verify insights for first segment
        expect(segment1?.insights).toHaveProperty('bio_keyword');
        expect(segment1?.insights.bio_keyword?.[0]).toHaveProperty('key', 'tech');
        expect(segment1?.insights.bio_keyword?.[0]).toHaveProperty('value', 30);
        
        // Verify influencers for first segment
        expect(segment1?.influencers?.[0]).toHaveProperty('id', 'inf-1');
        expect(segment1?.influencers?.[0]).toHaveProperty('affinity', 80);
    });

    it('should handle API errors gracefully', async () => {
        // Mock a failed API call
        (getReportInfo as jest.Mock).mockRejectedValue(new Error('API Error'));

        const result = await generateReportSummary('test-report-id');
        
        expect(result).toBeNull();
    });
});
