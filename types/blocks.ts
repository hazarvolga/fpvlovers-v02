export type BlockType =
  | 'text_block'
  | 'recommendation_block'
  | 'comparison_block'
  | 'affiliate_block'
  | 'sponsor_block'
  | 'warning_block'
  | 'retrieval_source_block'
  | 'build_block'
  | 'tune_analysis_block'
  | 'analytics_block';

export type LayoutType =
  | 'default'
  | 'comparison'
  | 'recommendation'
  | 'support'
  | 'diagnostic'
  | 'tutorial'
  | 'ecosystem_map';

export interface BaseBlock {
  id: string;
  type: BlockType;
  priority: number;
}

export interface TextBlock extends BaseBlock {
  type: 'text_block';
  content: string;
  heading?: string;
}

export interface RecommendationBlock extends BaseBlock {
  type: 'recommendation_block';
  items: Array<{
    title: string;
    reason: string;
    compatibility?: string;
    trustScore?: number;
  }>;
}

export interface AffiliateBlock extends BaseBlock {
  type: 'affiliate_block';
  productName: string;
  ctaText: string;
  affiliateUrl: string;
  trustLevel: 'high' | 'medium' | 'low';
}

export interface SponsorBlock extends BaseBlock {
  type: 'sponsor_block';
  sponsorName: string;
  message: string;
  contextRelevance: number;
}

export interface WarningBlock extends BaseBlock {
  type: 'warning_block';
  severity: 'info' | 'caution' | 'danger';
  message: string;
  regulation?: string;
}

export interface RetrievalSourceBlock extends BaseBlock {
  type: 'retrieval_source_block';
  sources: Array<{ dataset: string; score: number; snippet?: string }>;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
}

export interface BlockResponse {
  layout: LayoutType;
  blocks: BaseBlock[];
  intent: string;
  confidence: number;
  routing_reason: string;
  analytics: {
    route_confidence: number;
    fallback_used: boolean;
    regulation_safety: boolean;
    block_count: number;
    monetization_blocks: number;
  };
}
