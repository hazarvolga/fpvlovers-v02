import type { Locale } from './locale';

export type StartStep = {
  title: string;
  why: string;
  todo: string[];
  /** Candidate article slugs in priority order; missing slugs are skipped. */
  articleSlugs: string[];
  maxArticles?: number;
  page?: { label: string; href: string };
};

export const START_STEPS: Record<Locale, StartStep[]> = {
  en: [
    {
      title: 'Understand what FPV is',
      why: 'FPV (first-person view) means flying through goggles that show a live feed from the drone’s camera. Most FPV flying is fully manual, which is why practice comes before buying.',
      todo: ['Read one overview guide end to end', 'Bookmark the glossary for unfamiliar terms'],
      articleSlugs: [
        'fpv-beginner-setup-guide-the-easiest-way-to-get-flying',
        'fpv-pilot-roadmap-from-simulator-to-first-flight',
      ],
      page: { label: 'FPV glossary', href: '/academy/glossary' },
    },
    {
      title: 'Practice in a simulator',
      why: 'In a simulator, crashes are free. Building stick control here saves you broken parts and frustration later.',
      todo: ['Pick a simulator', 'Practice hovering and gentle turns until they feel natural'],
      articleSlugs: [
        'fpv-simulator-practice-plan-first-30-days',
        'the-best-fpv-simulators-in-2026-save-cash-and-log-hours-virtually',
      ],
      page: { label: 'Simulator training', href: '/academy/simulators' },
    },
    {
      title: 'Get your radio',
      why: 'Your radio controller works with the simulator now and with your drone later. It’s usually the piece of gear you keep the longest.',
      todo: ['Choose a radio that fits your hands and budget', 'Set it up and use it in the simulator'],
      articleSlugs: [
        'how-to-choose-your-first-fpv-radio-without-buying-twice',
        'elrs-radio-setup-guide-for-beginners',
        'best-fpv-radios-for-elrs-pilots-buying-guide-by-budget',
      ],
      maxArticles: 3,
    },
    {
      title: 'Choose your first drone and goggles',
      why: 'Start with a ready-to-fly kit or a tiny whoop. No soldering or building is needed to get in the air.',
      todo: ['Compare ready-to-fly kits by budget', 'Decide between analog and digital video'],
      articleSlugs: [
        'best-fpv-starter-kits-2026-rtf-bundles-for-beginners',
        'how-to-choose-your-first-tiny-whoop-indoor-fun-safe-training',
        'fpv-goggles-buying-guide-analog-vs-digital-for-beginners',
      ],
      page: { label: 'Starter kits', href: '/academy/starter-kits' },
    },
    {
      title: 'Learn the rules and battery safety',
      why: 'Drone rules depend on your country. Check your local aviation authority before flying outdoors, and learn how to charge and store LiPo batteries safely.',
      todo: ['Check the drone rules where you live', 'Learn safe LiPo charging and storage'],
      articleSlugs: [
        'fpv-regulations-for-beginners-in-the-united-states',
        'fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer',
      ],
      maxArticles: 2,
      page: { label: 'Rules & safety', href: '/regulations' },
    },
    {
      title: 'Make your first flight',
      why: 'Choose an open, empty area, run a quick pre-flight check, and start with short, gentle hovers.',
      todo: ['Fly a few short, low hovers', 'Know what to check if something doesn’t work'],
      articleSlugs: [
        'first-hover-training',
        'no-video-in-fpv-a-beginner-troubleshooting-checklist',
        'fpv-drone-won-t-arm-betaflight-troubleshooting-checklist',
      ],
      maxArticles: 3,
    },
  ],
  tr: [
    {
      title: 'FPV nedir, anla',
      why: 'FPV (birinci şahıs görüntü), drone kamerasından gelen canlı görüntüyü gözlükle görerek uçmak demektir. FPV uçuşunun büyük kısmı tamamen manueldir; bu yüzden satın almadan önce pratik gelir.',
      todo: ['Bir genel bakış rehberini baştan sona oku', 'Bilmediğin terimler için sözlüğü işaretle'],
      articleSlugs: [],
      page: { label: 'FPV sözlüğü', href: '/academy/glossary' },
    },
    {
      title: 'Simülatörde pratik yap',
      why: 'Simülatörde çarpmak bedava. Çubuk kontrolünü burada kurmak, ileride kırılan parça ve hayal kırıklığından tasarruf ettirir.',
      todo: ['Bir simülatör seç', 'Hover ve yumuşak dönüşleri doğal hissedene kadar tekrarla'],
      articleSlugs: [],
      page: { label: 'Simülatör eğitimi', href: '/academy/simulators' },
    },
    {
      title: 'Kumandanı al',
      why: 'Kumanda şimdi simülatörle, sonra drone ile çalışır. Genellikle en uzun süre elinde tuttuğun ekipmandır.',
      todo: ['El ölçüne ve bütçene uyan bir kumanda seç', 'Kur ve simülatörde kullan'],
      articleSlugs: [],
      maxArticles: 3,
    },
    {
      title: 'İlk drone ve gözlüğünü seç',
      why: 'Uçmaya hazır bir set veya tiny whoop ile başla. Havalanmak için lehim ya da drone toplamak gerekmez.',
      todo: ['Bütçeye göre hazır setleri karşılaştır', 'Analog ve dijital görüntü arasında karar ver'],
      articleSlugs: [],
      page: { label: 'Başlangıç setleri', href: '/academy/starter-kits' },
    },
    {
      title: 'Kuralları ve batarya güvenliğini öğren',
      why: 'Drone kuralları ülkeye göre değişir. Dışarıda uçmadan önce bulunduğun ülkenin havacılık kurumunu kontrol et ve LiPo bataryaları güvenli şarj etmeyi öğren.',
      todo: ['Yaşadığın yerdeki drone kurallarını kontrol et', 'Güvenli LiPo şarj ve saklama öğren'],
      articleSlugs: [],
      maxArticles: 2,
      page: { label: 'Kurallar ve güvenlik', href: '/regulations' },
    },
    {
      title: 'İlk uçuşunu yap',
      why: 'Açık ve boş bir alan seç, hızlı bir uçuş öncesi kontrol yap ve kısa, yumuşak hoverlarla başla.',
      todo: ['Birkaç kısa ve alçak hover yap', 'Bir şey çalışmazsa neyi kontrol edeceğini bil'],
      articleSlugs: [],
      maxArticles: 3,
    },
  ],
};
