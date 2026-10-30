import { StartHereView } from '@/features/academy/components/StartHereView';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'Buradan Başla: Altı Adımda İlk FPV Uçuşu | FPVLovers',
  description: 'FPV\'ye yeni misin? Altı adımı sırayla takip et: FPV nedir, simülatör pratiği, kumanda, ilk drone, kurallar ve ilk uçuş.',
  path: '/academy',
  locale: 'tr',
  type: 'website',
});

export default function TurkishStartHerePage() {
  return <StartHereView locale="tr" />;
}
