import { StartHereView } from '@/features/academy/components/StartHereView';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const revalidate = 300;

export const metadata = generateSeoMetadata({
  title: 'Start Here: Your First FPV Flight in Six Steps | FPVLovers',
  description: 'New to FPV? Follow six steps in order: understand FPV, practice in a simulator, get a radio, choose your first drone, learn the rules, and make your first flight.',
  path: '/academy',
  type: 'website',
});

export default function StartHerePage() {
  return <StartHereView locale="en" />;
}
