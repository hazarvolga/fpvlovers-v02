import { findDataset } from '@/lib/master-routing-tables';

export type DifyDocumentProcessRule = {
  mode: 'custom';
  rules: {
    pre_processing_rules: Array<{
      id: 'remove_stopwords' | 'remove_extra_spaces' | 'remove_urls_emails';
      enabled: boolean;
    }>;
    segmentation: {
      separator: string;
      max_tokens: number;
      chunk_overlap: number;
    };
  };
};

export function buildDifyDocumentProcessRule(datasetName: string): DifyDocumentProcessRule {
  const dataset = findDataset(datasetName);
  if (!dataset) throw new Error(`Unknown dataset process configuration: ${datasetName}`);

  return {
    mode: 'custom',
    rules: {
      pre_processing_rules: [
        { id: 'remove_stopwords', enabled: false },
        { id: 'remove_extra_spaces', enabled: true },
        { id: 'remove_urls_emails', enabled: false },
      ],
      segmentation: {
        separator: '\n\n',
        max_tokens: dataset.chunkTokens,
        chunk_overlap: dataset.overlapTokens,
      },
    },
  };
}
