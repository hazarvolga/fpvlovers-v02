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
  draftPath?: string;
  publishedPath?: string;
  createdAt: string;
  updatedAt: string;
};
