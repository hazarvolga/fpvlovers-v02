export type ContentJobStatus =
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
