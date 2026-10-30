import { navigationData } from '@/lib/navigationData';
import { DEFAULT_LOCALE, type Locale } from './locale';

export type NavCopyEntry = { title?: string; label?: string; description?: string };

/**
 * Turkish copy is an override map, not a second navigation tree: English stays
 * the single source of structure and hrefs, so the two languages cannot drift.
 * Group keys are the group href; item keys are `${groupHref}|${itemHref}`
 * because /academy is both a group and an item.
 */
export const NAV_COPY_TR: {
  groups: Record<string, NavCopyEntry>;
  items: Record<string, NavCopyEntry>;
} = {
  groups: {
    '/academy': { title: 'Buradan Başla', label: 'FPV\'ye yeni misin? Buradan başla' },
    '/buyers-guides': { title: 'Ekipman', label: 'Ne satın almalıyım?' },
    '/guides': { title: 'Rehberler', label: 'Öğren, onar, geliştir' },
    '/tools': { title: 'Araçlar', label: 'Hesaplayıcılar ve analiz araçları' },
    '/racing': { title: 'Yarış ve Haberler', label: 'Etkinlikler, sonuçlar ve gelişmeler' },
  },
  items: {
    '/academy|/academy': {
      title: 'İlk Uçuşa Altı Adım',
      description: 'Sıfırdan ilk gerçek uçuşa kadar sıralı yol haritası.',
    },
    '/academy|/academy/simulators': {
      title: 'Simülatör Eğitimi',
      description: 'Drone almadan önce çubuk kontrolünü güvenle öğren.',
    },
    '/academy|/regulations': {
      title: 'Kurallar ve Güvenlik',
      description: 'Nerede uçabilirsin, kayıt işlemleri ve batarya güvenliği.',
    },
    '/academy|/academy/glossary': {
      title: 'FPV Sözlüğü',
      description: 'Karşılaşacağın her kısaltmanın sade Türkçe karşılığı.',
    },
    '/academy|/academy/roadmap': {
      title: 'İlerleme Takibi',
      description: 'İsteğe bağlı: çalıştığın becerileri takip et.',
    },
    '/buyers-guides|/academy/starter-kits': {
      title: 'Başlangıç Setleri',
      description: 'Kutudan çıkar çıkmaz uçmaya hazır paketler.',
    },
    '/buyers-guides|/buyers-guides': {
      title: 'Satın Alma Rehberleri',
      description: 'Bütçene göre doğru ekipmanı seç.',
    },
    '/buyers-guides|/reviews': {
      title: 'İncelemeler',
      description: 'Gerçek kullanım deneyimine dayanan ürün incelemeleri.',
    },
    '/buyers-guides|/comparisons': {
      title: 'Karşılaştırmalar',
      description: 'İki model arasında kaldıysan yan yana bak.',
    },
    '/buyers-guides|/archive': {
      title: 'Drone Türleri',
      description: 'Tiny whoop, cinewhoop, 5 inç ve daha fazlası.',
    },
    '/guides|/guides?level=beginner': {
      title: 'Başlangıç Rehberleri',
      description: 'Hiç uçmamış biri için yazılmış rehberler.',
    },
    '/guides|/guides?topic=flying': {
      title: 'Uçuş Teknikleri',
      description: 'Kalkış, hover, dönüş ve iniş pratikleri.',
    },
    '/guides|/guides?topic=building': {
      title: 'Toplama ve Parçalar',
      description: 'Motor, ESC, uçuş kontrolcüsü, VTX ve gövde seçimi.',
    },
    '/guides|/guides?topic=troubleshooting': {
      title: 'Sorun Giderme',
      description: 'Görüntü yok, arm olmuyor, failsafe ve diğer sorunlar.',
    },
    '/guides|/engineering': {
      title: 'Mühendislik Detayları',
      description: 'Daha derine inmek isteyenler için teknik referanslar.',
    },
    '/tools|/tools/calculator': {
      title: 'Yapım Hesaplayıcısı',
      description: 'Ağırlık, itiş ve uçuş süresi tahmini.',
    },
    '/tools|/tools/part-matcher': {
      title: 'Parça Eşleştirici',
      description: 'Parçaların birbiriyle uyumlu olup olmadığını kontrol et.',
    },
    '/tools|/tools/component-duel': {
      title: 'Bileşen Düellosu',
      description: 'İki komponenti özelliklerine göre karşılaştır.',
    },
    '/tools|/tools/blackbox-tuning': {
      title: 'Blackbox Ayarı',
      description: 'Log verisinden titreşim ve PID ipuçları.',
    },
    '/tools|/tools/flight-critic': {
      title: 'Uçuş Eleştirmeni',
      description: 'Uçuşunu değerlendir, neyi geliştireceğini gör.',
    },
    '/racing|/racing/calendar': {
      title: 'Yarış Takvimi',
      description: 'Yaklaşan yarışlar ve tarihleri.',
    },
    '/racing|/racing/news': {
      title: 'Yarış Haberleri',
      description: 'Yarış dünyasından son gelişmeler.',
    },
    '/racing|/racing/rankings': {
      title: 'Sonuçlar ve Sıralamalar',
      description: 'Yarış sonuçları ve pilot sıralamaları.',
    },
  },
};

export type ChromeCopy = {
  home: string;
  search: string;
  openMenu: string;
  closeMenu: string;
  account: string;
  language: string;
};

export const CHROME_COPY: Record<Locale, ChromeCopy> = {
  en: {
    home: 'FPVLovers home',
    search: 'Search FPVLovers',
    openMenu: 'Open navigation',
    closeMenu: 'Close navigation',
    account: 'Account',
    language: 'Language',
  },
  tr: {
    home: 'FPVLovers ana sayfa',
    search: 'FPVLovers içinde ara',
    openMenu: 'Menüyü aç',
    closeMenu: 'Menüyü kapat',
    account: 'Hesap',
    language: 'Dil',
  },
};

export const FOOTER_COPY_TR: Record<string, string> = {
  '/privacy': 'Gizlilik Politikası',
  '/terms': 'Kullanım Koşulları',
  '/disclosure': 'Ortaklık Açıklaması',
  '/editorial-policy': 'Yayın İlkeleri',
  '/regulations': 'Kurallar',
  '/academy/glossary': 'Sözlük',
  '/advertise': 'Reklam',
  '/contact': 'İletişim',
  '/sitemap.xml': 'Site Haritası',
};

export function getNavigation(locale: Locale = DEFAULT_LOCALE): typeof navigationData {
  if (locale === DEFAULT_LOCALE) return navigationData;

  return navigationData.map((group) => {
    const groupCopy = NAV_COPY_TR.groups[group.href] ?? {};
    return {
      ...group,
      title: groupCopy.title ?? group.title,
      label: groupCopy.label ?? group.label,
      items: group.items.map((item) => {
        const itemCopy = NAV_COPY_TR.items[`${group.href}|${item.href}`] ?? {};
        return {
          ...item,
          title: itemCopy.title ?? item.title,
          description: itemCopy.description ?? item.description,
        };
      }),
    };
  });
}

export function getChromeCopy(locale: Locale): ChromeCopy {
  return CHROME_COPY[locale];
}

export function getFooterCopy(locale: Locale): Record<string, string> {
  return locale === 'tr' ? FOOTER_COPY_TR : {};
}
