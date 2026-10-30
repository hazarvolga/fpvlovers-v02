import type { Metadata } from 'next';
import '../globals.css';
import { RootShell } from '@/features/layout/components/RootShell';
import { buildRootMetadata } from '@/lib/seo/root-metadata';

export const metadata: Metadata = buildRootMetadata('tr');

export default function TurkishRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="tr">{children}</RootShell>;
}
