import { notFound } from 'next/navigation';
import { LegalConfigurationNotice } from '@/features/legal/components/LegalConfigurationNotice';
import { LegalDocumentPage } from '@/features/legal/components/LegalDocumentPage';
import { getLegalController, isLegalControllerConfigured } from '@/lib/legal/controller';
import { getLegalDocument } from '@/lib/legal/documents';
import { legalMetadata } from '@/lib/legal/metadata';
import { legalPath } from '@/lib/legal/paths';

export const dynamic = 'force-dynamic';

const controller = getLegalController();
const document = getLegalDocument('en', 'cookies', controller);

export const metadata = legalMetadata({
  title: `${document.title} | FPVLovers`,
  description: document.description,
  canonicalPath: legalPath('cookies', 'en'),
  languages: { en: legalPath('cookies', 'en'), tr: legalPath('cookies', 'tr'), 'x-default': legalPath('cookies', 'en') },
});

export default function Page() {
  if (!isLegalControllerConfigured(controller)) {
    if (process.env.NODE_ENV === 'production') notFound();
    return <LegalConfigurationNotice locale="en" />;
  }
  return <LegalDocumentPage locale="en" document={document} controller={controller} />;
}
