import { GuidesHub } from '@/features/guides/components/GuidesHub';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'Her Seviye İçin FPV Rehberleri | FPVLovers',
  description: 'FPV rehberlerini seviyeye ve konuya göre filtrele: uçuş teknikleri, toplama, ayar, sorun giderme, satın alma, kurallar ve yarış.',
  path: '/guides',
  locale: 'tr',
  type: 'website',
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TurkishGuidesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  return <GuidesHub locale="tr" level={firstParam(params.level)} topic={firstParam(params.topic)} />;
}
