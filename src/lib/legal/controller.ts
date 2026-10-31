export type LegalController = {
  name: string;
  address: string;
  email: string;
  kep?: string;
  taxId?: string;
};

export function getLegalController(): LegalController {
  return {
    name: process.env.LEGAL_CONTROLLER_NAME?.trim() || '',
    address: process.env.LEGAL_CONTROLLER_ADDRESS?.trim() || '',
    email: process.env.LEGAL_CONTROLLER_EMAIL?.trim() || '',
    kep: process.env.LEGAL_CONTROLLER_KEP?.trim() || undefined,
    taxId: process.env.LEGAL_CONTROLLER_TAX_ID?.trim() || undefined,
  };
}

export function isLegalControllerConfigured(controller: LegalController): boolean {
  return Boolean(controller.name && controller.address && controller.email);
}
