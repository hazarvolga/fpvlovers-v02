import fs from 'fs';

/**
 * Safely reads and parses a JSON file.
 * Returns the fallback value if the file doesn't exist, is invalid JSON, or another error occurs.
 */
export function safeReadJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw || raw.trim() === '') {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[safeReadJson] Error reading or parsing JSON file at ${filePath}:`, error);
    return fallback;
  }
}

/**
 * Safely parses a JSON string.
 * Returns the fallback value if the string is invalid JSON.
 */
export function safeParseJson<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString || jsonString.trim() === '') {
    return fallback;
  }
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error(`[safeParseJson] Error parsing JSON string:`, error);
    return fallback;
  }
}
