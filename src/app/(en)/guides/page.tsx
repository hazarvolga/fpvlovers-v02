import { GuidesHub } from '@/features/guides/components/GuidesHub';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'FPV Guides for Every Level | FPVLovers',
  description: 'Browse FPV guides by skill level and topic: flying skills, building, tuning, troubleshooting, buying advice, rules, and racing.',
  path: '/guides',
  type: 'website',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function GuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <GuidesHub locale="en" level={firstParam(params.level)} topic={firstParam(params.topic)} />;
}
