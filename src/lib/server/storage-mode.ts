export type StorageMode = 'files' | 'dual' | 'postgres';

export function getStorageMode(): StorageMode {
  const mode = process.env.FPV_STORAGE_MODE;
  if (mode === 'postgres') return 'postgres';
  if (mode === 'dual') return 'dual';
  return 'files'; // Default fallback
}
