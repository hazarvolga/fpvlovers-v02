export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'youtube-shorts'
  | 'tiktok'
  | 'x'
  | 'reddit'
  | 'linkedin';

export type SocialFact = {
  id: string;
  text: string;
  sourceSectionId: string;
};

export type SocialFactPack = {
  sourceSlug: string;
  sourceUrl: string;
  title: string;
  contentType: string;
  facts: SocialFact[];
  commercialDisclosureRequired: boolean;
};

export type SocialJob = {
  id: string;
  sourceSlug: string;
  status: 'draft' | 'validated' | 'approved' | 'scheduled' | 'published' | 'failed';
  platforms: SocialPlatform[];
  requiresHumanApproval: boolean;
  factPack: SocialFactPack;
  variants: SocialVariant[];
  createdAt: string;
  updatedAt: string;
};

export type SocialVariant = {
  platform: SocialPlatform;
  text: string;
  disclosure?: string;
};
