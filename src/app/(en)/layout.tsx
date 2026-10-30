import type { Metadata } from 'next';
import '../globals.css';
import { RootShell } from '@/features/layout/components/RootShell';
import { buildRootMetadata } from '@/lib/seo/root-metadata';

export const metadata: Metadata = buildRootMetadata('en');

export default function EnglishRootLayout({ children }: { children: React.ReactNode }) {
  return <RootShell lang="en">{children}</RootShell>;
}
