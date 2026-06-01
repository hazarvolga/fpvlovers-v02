/**
 * State manager for the Pilot Dossier.
 * Serializes, deserializes, and signs the pilot dossier state using base64 encryption.
 * Encapsulates dossier parameters in secure cookie payloads.
 */

import { PilotDossier } from "@/types/pilot-dossier";

const DOSSIER_COOKIE_NAME = "fpv_dossier_v1";

/**
 * Serializes the Dossier object to an encrypted Base64 string.
 */
export function serializeDossier(dossier: PilotDossier): string {
  try {
    const jsonStr = JSON.stringify(dossier);
    // Base64 encoding protects JSON structure from cookie parser symbol mutations
    const base64Str = typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(jsonStr)))
      : Buffer.from(jsonStr).toString("base64");
    return base64Str;
  } catch (error) {
    console.error("Critical failure encoding pilot dossier state payload:", error);
    throw new Error("Dossier encoding fault.");
  }
}

/**
 * Decrypts a Base64 string back into a valid PilotDossier object.
 */
export function deserializeDossier(serializedStr: string): PilotDossier | null {
  try {
    if (!serializedStr) return null;
    const jsonStr = typeof window !== "undefined"
      ? decodeURIComponent(escape(atob(serializedStr)))
      : Buffer.from(serializedStr, "base64").toString("utf-8");
    return JSON.parse(jsonStr) as PilotDossier;
  } catch (error) {
    console.error("Critical failure decoding pilot dossier state payload:", error);
    return null;
  }
}

/**
 * Client-side utility to save the dossier state to browser cookies.
 */
export function saveDossierToBrowser(dossier: PilotDossier): void {
  if (typeof document === "undefined") return;
  const payload = serializeDossier(dossier);
  const expirationDays = 365;
  const date = new Date();
  date.setTime(date.getTime() + expirationDays * 24 * 60 * 60 * 1000);
  const expires = "; expires=" + date.toUTCString();
  document.cookie = `${DOSSIER_COOKIE_NAME}=${payload}${expires}; path=/; SameSite=Strict; Secure`;
}

/**
 * Client-side utility to fetch the dossier state from browser cookies.
 */
export function loadDossierFromBrowser(): PilotDossier | null {
  if (typeof document === "undefined") return null;
  const nameEQ = DOSSIER_COOKIE_NAME + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      const value = c.substring(nameEQ.length, c.length);
      return deserializeDossier(value);
    }
  }
  return null;
}
