export type ContentJobStatus =
  | 'pending-approval'
  | 'brief'
  | 'queued'
  | 'generating'
  | 'generated'
  | 'reviewed'
  | 'approved'
  | 'published'
  | 'failed';

export type ContentTemplate =
  | 'tech-article'
  | 'product-review'
  | 'build-guide'
  | 'comparison'
  | 'troubleshooting'
  | 'regulation-guide'
  | 'community-roundup';

export type ContentJobSEO = {
  slug: string;
  metaDescription: string;
  keywords: string[];
};

export type ContentMediaAsset = {
  src: string;
  alt: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  credit?: string;
  license?: string;
};

export type ContentMedia = {
  coverImage: ContentMediaAsset;
  gallery: ContentMediaAsset[];
  figureCaptions: string[];
  imageSources: string[];
  attribution: string[];
};

export type ReviewTestingMethod = 'hands-on' | 'spec-analysis';

export type ProductRelationship = 'purchased' | 'supplied' | 'loaned' | 'none';

export type EditorialApprovalStatus = 'pending' | 'approved' | 'rejected';

export type EditorialReviewRecord = {
  contentClass: 'product-review';
  approvalStatus: EditorialApprovalStatus;
  editorName?: string;
  reviewedAt?: string;
  testingMethod?: ReviewTestingMethod;
  productRelationship?: ProductRelationship;
  compensationReceived: boolean;
  evidenceSources: string[];
  disclosure?: string;
};

export type AutonomousEditorialRecord = {
  contentClass: 'autonomous';
  checkedAt?: string;
  sourceCount?: number;
  unsupportedClaimCount?: number;
  duplicateScore?: number;
  metadataComplete?: boolean;
  linksValid?: boolean;
  disclosurePresent?: boolean;
};

export type EditorialRecord = EditorialReviewRecord | AutonomousEditorialRecord;

export type ContentJob = {
  id: string;
  briefSlug: string;
  title: string;
  category: string;
  status: ContentJobStatus;
  topic: string;
  language: 'en';
  template: ContentTemplate;
  promptVersion: string;
  sourceHints: string[];
  seo: ContentJobSEO;
  media?: ContentMedia;
  editorial?: EditorialRecord;
  draftPath?: string;
  publishedPath?: string;
  feedback?: string;
  draft?: Record<string, unknown>;
  error_message?: string;
  attempt_count?: number;
  scheduled_for?: string;
  started_at?: string;
  completed_at?: string;
  createdAt: string;
  updatedAt: string;
};
