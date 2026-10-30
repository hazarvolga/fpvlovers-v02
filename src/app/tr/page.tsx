import { BookOpen, Compass, ShieldAlert, Wrench } from 'lucide-react';
import { SubpageFeatureCard, SubpageHero, SubpageSectionHeader, SubpageShell } from '@/components/subpage/SubpageChrome';
import { HUB_COVER_IMAGES } from '@/lib/content-automation/hub-media';
import { generateSeoMetadata } from '@/lib/seo/metadata';

export const metadata = generateSeoMetadata({
  title: 'FPV\'ye Yeni Misin? Altı Adımda Başla | FPVLovers',
  description: 'FPV\'yi sıfırdan öğren: simülatör, kumanda seçimi, ilk drone, kurallar ve ilk uçuş. Hesap gerekmez.',
  path: '/',
  locale: 'tr',
  type: 'website',
});

export default function TurkishHomePage() {
  return (
    <SubpageShell>
      <SubpageHero
        label="Yeni Başlayanlar İçin"
        title="İlk uçuşuna"
        accent="altı adımda başla."
        description="FPV'yi sıfırdan öğren: simülatör, kumanda, ilk drone, kurallar ve ilk uçuş. Her adım neden önemli olduğunu ve hangi rehberi okuman gerektiğini anlatır. Hesap gerekmez."
        image={HUB_COVER_IMAGES.academy}
        imageAlt="FPV gözlüğü ve kumanda ile yeni başlayan pilot"
        stats={[
          { label: 'Adım', value: '6, sırayla' },
          { label: 'Hesap', value: 'Gerekmez' },
          { label: 'Lehim', value: 'Gerekmez' },
          { label: 'Başlangıç', value: 'Simülatör' },
        ]}
        actions={[
          { label: '1. adıma git', href: '/tr/academy#step-1' },
          { label: 'Başlangıç rehberleri', href: '/tr/guides?level=beginner' },
        ]}
      />

      <section className="mt-12">
        <SubpageSectionHeader label="Nereden başlamalıyım?" title="Yolculuğun" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SubpageFeatureCard
            title="Altı adımlık yol"
            description="FPV nedir sorusundan ilk gerçek uçuşa kadar sıralı rehber."
            href="/tr/academy"
            icon={Compass}
            meta="Başla"
            accent="cyan"
          />
          <SubpageFeatureCard
            title="Ekipman seçimi"
            description="Simülatör, kumanda, gözlük ve ilk drone: bütçene göre doğru seçim."
            href="/buyers-guides"
            icon={Wrench}
            meta="Ekipman"
            accent="amber"
          />
          <SubpageFeatureCard
            title="Kurallar ve güvenlik"
            description="Türkiye'de nerede uçabilirsin, kayıt işlemleri ve LiPo güvenliği."
            href="/regulations"
            icon={ShieldAlert}
            meta="Güvenlik"
            accent="green"
          />
          <SubpageFeatureCard
            title="Rehberler"
            description="Seviyene ve konuya göre filtrelenmiş rehber kütüphanesi."
            href="/tr/guides"
            icon={BookOpen}
            meta="Okuma"
            accent="cyan"
          />
        </div>
      </section>
    </SubpageShell>
  );
}
