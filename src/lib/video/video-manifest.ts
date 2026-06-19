import type { SocialFact, SocialFactPack } from '@/lib/social/types';

export type VideoScene = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  narration: string;
  onScreenText: string;
  factIds: string[];
  assetRefs: string[];
};

export type VideoManifest = {
  version: 1;
  sourceSlug: string;
  contentClass: string;
  requiresHumanApproval: boolean;
  language: 'en';
  aspectRatio: '9:16';
  targetDurationSeconds: number;
  facts: SocialFact[];
  scenes: VideoScene[];
  cta: string;
  disclosures: string[];
  containsSyntheticMedia: boolean;
  paidProductPlacement: boolean;
  uploadVisibility: 'private' | 'unlisted' | 'public';
};

export type VideoManifestValidation = {
  valid: boolean;
  errors: string[];
};

export function validateVideoManifest(
  manifest: VideoManifest,
  factPack: SocialFactPack,
): VideoManifestValidation {
  const errors: string[] = [];
  if (manifest.sourceSlug !== factPack.sourceSlug) errors.push('Manifest source slug does not match the fact pack.');
  if (manifest.language !== 'en') errors.push('FPVLovers video manifests must use English.');
  if (manifest.aspectRatio !== '9:16') errors.push('Short-form video must use a 9:16 aspect ratio.');
  if (manifest.targetDurationSeconds < 15 || manifest.targetDurationSeconds > 60) {
    errors.push('Target duration must be between 15 and 60 seconds.');
  }
  if (manifest.uploadVisibility !== 'private') {
    errors.push('Automated YouTube uploads must remain private.');
  }
  if (manifest.requiresHumanApproval && manifest.contentClass !== 'review') {
    errors.push('Human approval may only be inherited by review or sponsored workflows.');
  }
  if (factPack.commercialDisclosureRequired && manifest.disclosures.length === 0) {
    errors.push('Commercial video manifests require a disclosure.');
  }

  const allowedFactIds = new Set(factPack.facts.map((fact) => fact.id));
  let previousEnd = 0;
  for (const scene of manifest.scenes) {
    if (!scene.id.trim()) errors.push('Every video scene requires an id.');
    if (scene.startSeconds < previousEnd) errors.push(`Scene ${scene.id} overlaps the previous scene.`);
    if (scene.endSeconds <= scene.startSeconds) errors.push(`Scene ${scene.id} has invalid timing.`);
    if (scene.endSeconds > manifest.targetDurationSeconds) errors.push(`Scene ${scene.id} exceeds target duration.`);
    for (const id of scene.factIds) {
      if (!allowedFactIds.has(id)) errors.push(`Scene ${scene.id} references unsupported fact ${id}.`);
    }
    previousEnd = scene.endSeconds;
  }
  if (manifest.scenes.length === 0) errors.push('Video manifest requires at least one scene.');
  if (manifest.scenes.at(-1)?.endSeconds !== manifest.targetDurationSeconds) {
    errors.push('Final scene must end at the target duration.');
  }

  return { valid: errors.length === 0, errors };
}

type YouTubeUploadCopy = {
  title: string;
  description: string;
  tags: string[];
};

export type PrivateYouTubeUploadPayload = {
  snippet: {
    title: string;
    description: string;
    tags: string[];
    categoryId: string;
  };
  status: {
    privacyStatus: 'private';
    selfDeclaredMadeForKids: false;
    containsSyntheticMedia: boolean;
  };
  paidProductPlacementDetails: {
    hasPaidProductPlacement: boolean;
  };
};

export function buildPrivateYouTubeUploadPayload(
  manifest: VideoManifest,
  copy: YouTubeUploadCopy,
): PrivateYouTubeUploadPayload {
  return {
    snippet: {
      title: copy.title.slice(0, 100),
      description: [copy.description, ...manifest.disclosures].filter(Boolean).join('\n\n'),
      tags: copy.tags.slice(0, 25),
      categoryId: '28',
    },
    status: {
      privacyStatus: 'private',
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: manifest.containsSyntheticMedia,
    },
    paidProductPlacementDetails: {
      hasPaidProductPlacement: manifest.paidProductPlacement,
    },
  };
}
