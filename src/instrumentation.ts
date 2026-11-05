export async function register(): Promise<void> {
  // The guarded import lets Next drop this branch from the edge bundle,
  // where the pg driver (fs/path/stream) cannot be resolved.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { runStartupMigrations } = await import('./lib/server/startup-migrations');
    await runStartupMigrations();
  }
}
