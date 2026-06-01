export interface DbContentJob {
  id: string;
  status: string;
  topic: string | null;
  keyword: string | null;
  intent: string | null;
  language: string;
  title: string | null;
  slug: string | null;
  brief: Record<string, unknown>;
  draft: Record<string, unknown>;
  publish_artifact: Record<string, unknown>;
  error_message: string | null;
  attempt_count: number;
  scheduled_for: Date | null;
  started_at: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  legacy_file_hash: string | null;
}

export interface DbCrawlJob {
  id: string;
  url: string;
  dataset_id: string | null;
  dataset_key: string | null;
  status: string;
  priority: number;
  source: string | null;
  source_pack: string | null;
  retry_count: number;
  next_attempt_at: Date | null;
  last_attempt_at: Date | null;
  completed_at: Date | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  legacy_file_hash: string | null;
}

export interface DbAutomationRun {
  id: string;
  kind: string;
  status: string;
  started_at: Date;
  finished_at: Date | null;
  summary: Record<string, unknown>;
  error_message: string | null;
}

export interface DbSchemaMigration {
  version: string;
  name: string;
  checksum: string;
  applied_at: Date;
}
