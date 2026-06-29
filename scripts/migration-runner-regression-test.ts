import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { PoolClient, QueryResult, QueryResultRow } from '../src/lib/server/db';
import {
  discoverMigrationFiles,
  executeMigrationPlan,
} from '../src/lib/server/migrations';

type Call = { text: string; params?: unknown[] };

class FakeClient implements PoolClient {
  readonly calls: Call[] = [];
  releaseCount = 0;

  constructor(
    private readonly options: {
      failMigration?: boolean;
      unlockResult?: boolean;
    } = {},
  ) {}

  async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<QueryResult<T>> {
    this.calls.push({ text, params });
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.startsWith('SELECT version, checksum')) {
      return result([]);
    }
    if (normalized.startsWith('SELECT pg_advisory_unlock')) {
      return result([{ pg_advisory_unlock: this.options.unlockResult ?? true }] as unknown as T[]);
    }
    if (this.options.failMigration && text.includes('Evidence-bound catalog trust foundation')) {
      throw new Error('migration exploded');
    }
    return result([]);
  }

  release(): void {
    this.releaseCount += 1;
  }
}

function result<T extends QueryResultRow>(rows: T[]): QueryResult<T> {
  return { rows, command: '', rowCount: rows.length, oid: 0, fields: [] };
}

async function main(): Promise<void> {
  const migrationsDir = new URL('../db/migrations', import.meta.url);
  const migration = discoverMigrationFiles(migrationsDir.pathname)
    .find((candidate) => candidate.version === '0008');
  assert.ok(migration);
  const migrationSql = readFileSync(migration.filePath, 'utf8');

  const successClient = new FakeClient();
  const success = await executeMigrationPlan(successClient, [migration]);
  assert.deepEqual(success.applied, ['0008']);
  assert.equal(successClient.releaseCount, 1);
  const successSql = successClient.calls.map((call) => call.text);
  const ensureSchemaOffset = successSql.findIndex((sql) => sql.includes('CREATE SCHEMA IF NOT EXISTS'));
  const lockOffset = successSql.findIndex((sql) => sql.includes('pg_advisory_lock'));
  const appliedReadOffset = successSql.findIndex((sql) => sql.includes('SELECT version, checksum'));
  assert.ok(ensureSchemaOffset >= 0 && lockOffset > ensureSchemaOffset);
  assert.ok(appliedReadOffset > lockOffset);
  assert.ok(successSql.includes('BEGIN'));
  assert.ok(successSql.includes(migrationSql));
  assert.ok(successSql.some((sql) => sql.startsWith('INSERT INTO fpvlovers_app.schema_migrations')));
  assert.ok(successSql.includes('COMMIT'));
  assert.ok(successSql.some((sql) => sql.includes('pg_advisory_unlock')));
  assert.ok(successSql.indexOf('BEGIN') < successSql.indexOf(migrationSql));
  assert.ok(successSql.indexOf(migrationSql) < successSql.indexOf('COMMIT'));
  assert.ok(successSql.findIndex((sql) => sql.includes('pg_advisory_unlock')) > successSql.indexOf('COMMIT'));

  const unlockFalseClient = new FakeClient({ unlockResult: false });
  await assert.rejects(
    executeMigrationPlan(unlockFalseClient, [migration]),
    /advisory lock was not held by the migration client/i,
  );
  assert.equal(unlockFalseClient.releaseCount, 1);

  const failedClient = new FakeClient({ failMigration: true, unlockResult: false });
  await assert.rejects(executeMigrationPlan(failedClient, [migration]), /migration exploded/);
  const failedSql = failedClient.calls.map((call) => call.text);
  assert.ok(failedSql.includes('ROLLBACK'));
  assert.ok(failedSql.findIndex((sql) => sql.includes('pg_advisory_unlock')) > failedSql.indexOf('ROLLBACK'));
  assert.equal(failedClient.releaseCount, 1);

  console.log('migration runner regression tests passed');
}

void main();
