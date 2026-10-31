import type { LegalController } from './controller';
import { LEGAL_DOCUMENT_VERSION } from './version';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocument = {
  key: 'privacy' | 'cookies' | 'terms' | 'kvkk';
  title: string;
  description: string;
  updated: string;
  sections: LegalSection[];
};

export type LocaleLegalDocuments = {
  privacy: LegalDocument;
  cookies: LegalDocument;
  terms: LegalDocument;
  kvkk?: LegalDocument;
};

function controllerLine(controller: LegalController, locale: 'tr' | 'en'): string {
  const parts = [
    controller.name,
    controller.address,
    controller.email,
    controller.kep ? `KEP: ${controller.kep}` : '',
    controller.taxId ? `${locale === 'tr' ? 'Vergi No' : 'Tax ID'}: ${controller.taxId}` : '',
  ].filter(Boolean);
  return parts.join(' · ');
}

export function buildLegalDocuments(controller: LegalController): { tr: LocaleLegalDocuments; en: LocaleLegalDocuments } {
  return {
    tr: {
      kvkk: {
        key: 'kvkk',
        title: 'KVKK Aydınlatma Metni',
        description: '6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri sorumlusu, işleme amaçları, hukuki sebepler, aktarım ve haklarınıza ilişkin aydınlatma metni.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Veri Sorumlusu',
            paragraphs: [
              `Veri sorumlusu: ${controllerLine(controller, 'tr')}.`,
              'Bu metin, fpvlovers.com.tr üzerinden kişisel veri toplanan tüm kullanıcılar için geçerlidir.',
            ],
          },
          {
            heading: '2. İşlenen Kişisel Veriler',
            paragraphs: ['Hizmetin niteliğine göre aşağıdaki veriler işlenebilir:'],
            bullets: [
              'Bülten: e-posta adresi, abonelik kaynağı, onay zamanı ve onay metni sürümü.',
              'İletişim: ad, e-posta adresi, talep türü ve mesaj içeriği.',
              'Hesap: ad, e-posta adresi, parola özeti, sağlayıcı kimliği (Google/Discord/GitHub ile giriş), hesap ilerlemesi.',
              'Teknik: IP adresi (yalnızca hız sınırlama için geçici), tarayıcı/cihaz bilgisi, erişim zamanı ve hata kayıtları.',
              'Analitik: sayfa ve içerik tanımlayıcıları, arama terimleri ve tıklanan sonuçlar; yalnızca açık rıza ile ve kimlik oluşturmayan olay kayıtları.',
              'Çerez tercihi: zorunlu, analitik ve pazarlama kategorileri ile tercih zamanı.',
            ],
          },
          {
            heading: '3. İşleme Amaçları',
            paragraphs: ['Kişisel veriler aşağıdaki amaçlarla işlenir:'],
            bullets: [
              'Bülten aboneliğinin kurulması, onaylanması ve yönetilmesi.',
              'İletişim taleplerinin yanıtlanması ve içerik düzeltmelerinin incelenmesi.',
              'Hesap oluşturulması, oturum güvenliği ve pilot ilerlemesinin saklanması.',
              'Site güvenliği, kötüye kullanımın önlenmesi ve hata ayıklama.',
              'Toplu analitik ile içerik ve kullanıcı deneyiminin iyileştirilmesi.',
              'Hukuki yükümlülüklerin yerine getirilmesi ve yetkili kurumlara bilgi verilmesi.',
            ],
          },
          {
            heading: '4. Hukuki Sebepler',
            paragraphs: [
              'Veriler, KVKK m.5/2 uyarınca sözleşmenin kurulması veya ifası (hesap ve bülten), hukuki yükümlülük (saklama ve yetkili kurum talepleri), bir hakkın tesisi/kullanılması/korunması ve meşru menfaat (güvenlik, hata ayıklama) sebeplerine dayanılarak işlenir.',
              'Bülten, ticari elektronik ileti, analitik ve zorunlu olmayan çerezler için açık rızanız alınır. Açık rıza, onay kutusu işaretlenerek ve çift onay e-postası ile teyit edilerek kaydedilir. Rızanızı dilediğiniz zaman geri çekebilirsiniz; geri çekme, geri çekmeden önceki işlemlerin hukukiliğini etkilemez.',
            ],
          },
          {
            heading: '5. Toplama Yöntemi',
            paragraphs: [
              'Veriler; web formları, çerezler, oturum açma sağlayıcıları, sunucu günlükleri ve e-posta etkileşimleri aracılığıyla elektronik ortamda toplanır. Zorunlu alanlar form üzerinde belirtilir; zorunlu olmayan alanların doldurulması isteğe bağlıdır.',
            ],
          },
          {
            heading: '6. Alıcılar ve Yurt Dışına Aktarım',
            paragraphs: [
              'Veriler; barındırma ve veritabanı hizmeti, e-posta gönderim hizmeti, yapay zekâ/arama altyapısı, analitik hizmeti ve tıkladığınızda yönlendirildiğiniz satıcılar ile paylaşılabilir. Yetkili kamu kurumlarına hukuki talep halinde bilgi verilebilir.',
              'Barındırma ve yapay zekâ/e-posta hizmetlerinin bir kısmı Türkiye dışında yerleşik olabilir. Yurt dışına aktarım, KVKK m.9 kapsamında uygun güvenceye veya açık rızanıza dayanır. Aktarımın hukuki sebebi ve alıcı kategorileri bu metinde ve Çerez Politikası’nda açıklanır.',
              'Affiliate bağlantılarına tıkladığınızda satıcının kendi sitesine gidersiniz; o sitedeki veri işleme faaliyetlerinden satıcı sorumludur.',
            ],
          },
          {
            heading: '7. Saklama Süreleri',
            paragraphs: ['Veriler, amaç için gerekli süre ve mevzuattaki zamanaşımı süreleri boyunca saklanır:'],
            bullets: [
              'Bülten: onaylı abonelik aktif olduğu sürece; abonelikten çıkma sonrası ispat amacıyla en fazla 2 yıl.',
              'Onaylanmamış abonelik: 30 gün.',
              'İletişim talepleri: yanıtın tamamlanmasından sonra en fazla 1 yıl.',
              'Hesap ve ilerleme: hesap silinene kadar; silme talebinden sonra yedeklerde en fazla 30 gün.',
              'Analitik olayları: en fazla 180 gün; toplu özetler kişisel veri içermeyecek şekilde daha uzun süre saklanabilir.',
              'Çerez rıza kayıtları: rızanın ispatı için en fazla 5 yıl.',
            ],
          },
          {
            heading: '8. Veri Güvenliği',
            paragraphs: [
              'TLS ile şifreli iletişim, parola özetleme, erişim kontrolü, hız sınırlama, güvenli yapılandırma ve düzenli yedekleme uygulanır. Veri ihlali tespit edilirse ilgili kişiler ve yetkili makamlar mevzuatta öngörülen sürelerde bilgilendirilir.',
            ],
          },
          {
            heading: '9. Haklarınız',
            paragraphs: ['KVKK m.11 uyarınca:'],
            bullets: [
              'Kişisel verilerinizin işlenip işlenmediğini öğrenme ve buna ilişkin bilgi talep etme.',
              'İşleme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme.',
              'Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri öğrenme.',
              'Eksik veya yanlış işlenen verilerin düzeltilmesini isteme.',
              'KVKK m.7’deki şartlar çerçevesinde silinmesini veya yok edilmesini isteme.',
              'Düzeltme/silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme.',
              'Münhasıran otomatik sistemlerle analiz sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme.',
              'Kanuna aykırı işleme nedeniyle zarara uğramanız halinde giderilmesini talep etme.',
            ],
          },
          {
            heading: '10. Başvuru',
            paragraphs: [
              `Taleplerinizi ${controller.email} adresine veya yazılı olarak ${controller.address} adresine iletebilirsiniz. Başvuruda adınız, iletişim bilginiz ve talebinizin açıkça belirtilmesi gerekir. Talepler en geç 30 gün içinde ücretsiz olarak yanıtlanır; işlemin ayrıca maliyet gerektirmesi halinde Kurul tarifesindeki ücret alınabilir.`,
            ],
          },
          {
            heading: '11. Değişiklikler',
            paragraphs: [
              `Bu metin ${LEGAL_DOCUMENT_VERSION} tarihinde güncellenmiştir. Önemli değişiklikler sitede duyurulur; yürürlük tarihinden sonra hizmeti kullanmaya devam etmeniz güncel metni kabul ettiğiniz anlamına gelmez, gerekli hallerde yeniden onay alınır.`,
            ],
          },
        ],
      },
      privacy: {
        key: 'privacy',
        title: 'Gizlilik Politikası',
        description: 'FPVLovers’ın kişisel verileri nasıl topladığı, kullandığı, sakladığı ve koruduğuna ilişkin genel gizlilik politikası.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Kapsam',
            paragraphs: [
              'Bu politika fpvlovers.com.tr ve alt alan adlarında işlenen kişisel verileri kapsar. Türkiye’deki kullanıcılar için KVKK Aydınlatma Metni, Avrupa Birliği/AEA’daki kullanıcılar için GDPR kapsamındaki haklar, Kaliforniya’daki kullanıcılar için CCPA/CPRA kapsamındaki şeffaflık yükümlülükleri geçerlidir.',
            ],
          },
          {
            heading: '2. Topladığımız Veriler',
            paragraphs: ['Hizmete göre şu verileri toplarız:'],
            bullets: [
              'Bülten: e-posta adresi, onay zamanı ve kaynağı.',
              'İletişim: ad, e-posta, talep türü, mesaj.',
              'Hesap: ad, e-posta, parola özeti, OAuth sağlayıcı bilgisi, ilerleme.',
              'Analitik (yalnızca rızanızla): sayfa/içerik tanımlayıcıları, gönderdiğiniz arama terimleri, tıkladığınız sonuçlar ve cihaz/tarayıcı türü.',
              'Çerez tercihleri ve teknik güvenlik kayıtları.',
            ],
          },
          {
            heading: '3. Kullanım Amaçları',
            paragraphs: [
              'Verileri bülteni göndermek, talepleri yanıtlamak, hesabı ve ilerlemeyi yönetmek, site güvenliğini sağlamak, analitikle (yalnızca açık rızanızla) içeriği iyileştirmek ve hukuki yükümlülükleri yerine getirmek için kullanırız. Verilerinizi satmayız.',
            ],
          },
          {
            heading: '4. Hukuki Sebepler',
            paragraphs: [
              'Türkiye’de KVKK m.5/2; AB’de GDPR m.6 (sözleşme, hukuki yükümlülük, meşru menfaat, açık rıza). Bülten, analitik ve zorunlu olmayan çerezler için açık rıza alınır; rıza her zaman geri çekilebilir.',
            ],
          },
          {
            heading: '5. Paylaşım ve Yurt Dışına Aktarım',
            paragraphs: [
              'Barındırma, e-posta gönderimi, yapay zekâ/arama altyapısı ve analitik hizmet sağlayıcılarıyla veri paylaşabiliriz. Bu sağlayıcılar Türkiye dışında yerleşik olabilir. Aktarımlar KVKK m.9 ve GDPR m.44+ kapsamında uygun güvencelere veya açık rızaya dayanır. Affiliate satıcılarına tıklama sonrası o sitenin gizlilik politikası geçerlidir.',
            ],
          },
          {
            heading: '6. Saklama ve Güvenlik',
            paragraphs: [
              'Veriler amaç için gerekli süre boyunca saklanır; bülten onayı abonelik boyunca ve ispat için en fazla 2 yıl, analitik olayları en fazla 180 gün, iletişim talepleri en fazla 1 yıl tutulur. TLS, erişim kontrolü, parola özetleme ve yedekleme uygularız.',
            ],
          },
          {
            heading: '7. Haklarınız',
            paragraphs: [
              'KVKK m.11 ve GDPR m.15–22 kapsamında erişim, düzeltme, silme, kısıtlama, taşınabilirlik, itiraz ve rıza geri çekme haklarınız vardır. Haklarınızı kullanmak için hello@fpvlovers.com.tr adresine yazın; talepleri en geç 30 gün içinde yanıtlarız.',
            ],
          },
          {
            heading: '8. Çocuklar',
            paragraphs: [
              'Hizmet 13 yaşından küçük çocuklara yönelik değildir. 13–16 yaş arası kullanıcılar için yerel mevzuatın gerektirdiği hallerde ebeveyn onayı gerekir.',
            ],
          },
          {
            heading: '9. AB ve ABD Kullanıcıları',
            paragraphs: [
              'AB/AEA kullanıcıları GDPR kapsamındaki haklarını kullanabilir. Kaliforniya kullanıcıları için: kişisel bilgileri satmıyoruz; CCPA/CPRA kapsamındaki erişim, silme ve ayrımcılık görmeme hakları geçerlidir.',
            ],
          },
          {
            heading: '10. İletişim',
            paragraphs: [`Sorularınız için ${controller.email} adresine yazabilirsiniz. Veri sorumlusu: ${controllerLine(controller, 'tr')}.`],
          },
        ],
      },
      cookies: {
        key: 'cookies',
        title: 'Çerez Politikası',
        description: 'FPVLovers’ta kullanılan çerezler, amaçları, süreleri ve tercihlerinizi nasıl yöneteceğiniz.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Çerez Nedir?',
            paragraphs: [
              'Çerezler, tarayıcınıza kaydedilen küçük metin dosyalarıdır. Oturumun sürdürülmesi, güvenlik ve tercihlerin hatırlanması için kullanılır. Zorunlu ve işlevsel çerezler dışındaki çerezler yalnızca açık rızanızla yüklenir.',
            ],
          },
          {
            heading: '2. Kategoriler',
            paragraphs: ['Çerezleri dört kategoride değerlendiririz:'],
            bullets: [
              'Zorunlu: oturum açma, CSRF koruması ve çerez tercihinin hatırlanması.',
              'İşlevsel: sizin başlattığınız araçların tercihlerini hatırlar (ör. Pilot Dossier); ePrivacy yönergesinin talebiniz üzerine sunulan hizmet istisnası kapsamında değerlendirilir.',
              'Analitik: sayfa görüntüleme ve arama metrikleri; yalnızca rıza ile.',
              'Pazarlama: reklam veya affiliate izleme pikseli; şu an kullanılmıyor, eklenirse yalnızca rıza ile.',
            ],
          },
          {
            heading: '3. Çerez Tablosu',
            paragraphs: ['Başlıca çerezler:'],
            bullets: [
              'authjs.session-token (üretimde __Secure-authjs.session-token) — zorunlu — oturum — oturum süresi.',
              'authjs.csrf-token (üretimde __Secure-authjs.csrf-token) — zorunlu — CSRF koruması — oturum süresi.',
              'fpv_consent — zorunlu — çerez tercihi — 1 yıl.',
              'fpv_dossier_v1 — işlevsel — Pilot Dossier tercihlerinizi hatırlar — 1 yıl, Akademi/Dossier özelliklerini kullandığınızda.',
              '_ga, _ga_* — analitik — Google Analytics — yalnızca rıza ile, en fazla 2 yıl.',
              'Satıcı çerezleri — pazarlama — affiliate satıcısının alan adında, tıklama sonrası — satıcının politikası.',
            ],
          },
          {
            heading: '4. Tercihlerinizi Yönetme',
            paragraphs: [
              'Site altındaki “Çerez Tercihleri” bağlantısından kategorileri değiştirebilirsiniz. Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz; zorunlu çerezlerin engellenmesi oturum açma gibi işlevleri bozabilir.',
            ],
          },
          {
            heading: '5. Üçüncü Taraf Çerezleri',
            paragraphs: [
              'Affiliate bağlantılarına tıkladığınızda satıcının sitesine gidersiniz; o sitede satıcının çerezleri ve gizlilik politikası geçerlidir. Sitede üçüncü taraf reklam pikseli kullanmıyoruz.',
            ],
          },
          {
            heading: '6. Rızanın Geri Çekilmesi',
            paragraphs: [
              'Çerez tercihlerinizi değiştirerek veya çerezleri silerek rızanızı geri çekebilirsiniz. Geri çekme, önceki işlemlerin hukukiliğini etkilemez.',
            ],
          },
        ],
      },
      terms: {
        key: 'terms',
        title: 'Kullanım Koşulları',
        description: 'FPVLovers hizmetlerinin kullanım koşulları, pilot sorumluluğu, fikri mülkiyet ve sorumluluk sınırları.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Kabul',
            paragraphs: [
              'fpvlovers.com.tr’yi kullanarak bu koşulları kabul edersiniz. Koşulları kabul etmiyorsanız siteyi ve araçları kullanmayın.',
            ],
          },
          {
            heading: '2. Hizmetin Niteliği',
            paragraphs: [
              'FPVLovers bir bilgi ve eğitim platformudur; e-ticaret sitesi değildir. Donanım satmaz, stok tutmaz, fiyat karşılaştırma motoru işletmez. İçerikler bilgilendirme amaçlıdır.',
            ],
          },
          {
            heading: '3. Pilot Sorumluluğu ve Güvenlik',
            paragraphs: [
              'FPV uçuşu ve donanım montajı elektriksel, fiziksel ve hukuki risk taşır. Hesaplayıcı, PID/blackbox önerisi ve parça eşleştirme çıktıları eğitim amaçlıdır. Bileşenleri, kablolamayı ve lehimleri doğrulamak; SHGM/SHY, FAA ve yerel kurallara uymak tamamen kullanıcının sorumluluğundadır.',
            ],
          },
          {
            heading: '4. Fikri Mülkiyet',
            paragraphs: [
              'Rehberler, hesaplayıcılar, sayfa düzeni ve grafikler telif hakkıyla korunur. Kişisel öğrenme ve yerel yapımlar için kullanılabilir; ticari amaçla otomatik kazıma veya çoğaltma yazılı izin gerektirir.',
            ],
          },
          {
            heading: '5. Ticari Bağlantılar',
            paragraphs: [
              'Bazı ürün bağlantıları affiliate veya sponsorluk içerebilir. Ticari bağlantılar açıkça etiketlenir; editöryel sonuçlar ticari ilişkiden bağımsızdır. Ayrıntılar için Ortaklık Açıklaması sayfasına bakın.',
            ],
          },
          {
            heading: '6. Sorumluluğun Sınırlandırılması',
            paragraphs: [
              'FPVLovers, geliştiricileri ve katkıda bulunanlar; araçların veya rehberlerin kullanımından doğan doğrudan, dolaylı, arızi veya sonuç olarak ortaya çıkan zararlardan sorumlu değildir. Araçlar “olduğu gibi” sunulur.',
            ],
          },
          {
            heading: '7. Hesap Güvenliği',
            paragraphs: [
              'Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Yetkisiz erişim fark ederseniz derhal hello@fpvlovers.com.tr adresine bildirin.',
            ],
          },
          {
            heading: '8. Uygulanacak Hukuk',
            paragraphs: [
              'Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici mevzuatından doğan haklar saklıdır. Uyuşmazlıklarda yetkili mahkemeler Türkiye’deki yerleşim yerinize göre belirlenir.',
            ],
          },
          {
            heading: '9. İletişim',
            paragraphs: [`Sorularınız için ${controller.email} adresine yazabilirsiniz. Veri sorumlusu: ${controllerLine(controller, 'tr')}.`],
          },
        ],
      },
    },
    en: {
      privacy: {
        key: 'privacy',
        title: 'Privacy Policy',
        description: 'How FPVLovers collects, uses, stores and protects personal data under GDPR, KVKK and CCPA principles.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Scope',
            paragraphs: [
              'This policy covers fpvlovers.com.tr. Turkish users have the rights described in our KVKK notice. Users in the EU/EEA have GDPR rights; California users have CCPA/CPRA transparency rights.',
            ],
          },
          {
            heading: '2. Data We Collect',
            paragraphs: ['Depending on the feature you use, we collect:'],
            bullets: [
              'Newsletter: email address, consent time and source.',
              'Contact: name, email, inquiry type and message.',
              'Account: name, email, password hash, OAuth provider identity and learning progress.',
              'Analytics (only with your consent): page/content identifiers, the search terms you submit, the results you click, and device/browser type.',
              'Cookie choices and security logs.',
            ],
          },
          {
            heading: '3. How We Use Data',
            paragraphs: [
              'We use data to send the newsletter, answer inquiries, operate accounts and progress, secure the site, improve content through analytics (only with your consent), and meet legal obligations. We do not sell personal information.',
            ],
          },
          {
            heading: '4. Legal Bases',
            paragraphs: [
              'Under GDPR Art. 6 we rely on contract, legal obligation, legitimate interests and consent. Newsletter subscriptions, analytics, marketing and non-essential cookies require consent, which you can withdraw at any time.',
            ],
          },
          {
            heading: '5. Sharing and International Transfers',
            paragraphs: [
              'We share data with hosting, email delivery, AI/search infrastructure and analytics providers. Some providers may be located outside your country. Transfers rely on appropriate safeguards or your explicit consent. Affiliate links take you to a retailer’s own site, where that retailer’s policy applies.',
            ],
          },
          {
            heading: '6. Retention and Security',
            paragraphs: [
              'We keep data only as long as needed: newsletter consent for the subscription plus up to 2 years for proof, analytics events for up to 180 days, and contact inquiries for up to 1 year. We use TLS, access controls, password hashing and backups.',
            ],
          },
          {
            heading: '7. Your Rights',
            paragraphs: [
              'You have rights of access, correction, deletion, restriction, portability, objection and consent withdrawal under GDPR Arts. 15–22 and KVKK Art. 11. To exercise them, email hello@fpvlovers.com.tr; we respond within 30 days.',
            ],
          },
          {
            heading: '8. Children',
            paragraphs: [
              'The service is not directed to children under 13. Where local law requires parental consent for users under 16, that consent must be obtained.',
            ],
          },
          {
            heading: '9. California Notice',
            paragraphs: [
              'We do not sell personal information. California residents may request access, deletion and non-discrimination under CCPA/CPRA by contacting hello@fpvlovers.com.tr.',
            ],
          },
          {
            heading: '10. Contact',
            paragraphs: [`Data controller: ${controllerLine(controller, 'en')}. Email: ${controller.email}.`],
          },
        ],
      },
      cookies: {
        key: 'cookies',
        title: 'Cookie Policy',
        description: 'Cookies used on FPVLovers, their purposes and how to manage your choices.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. What Are Cookies?',
            paragraphs: [
              'Cookies are small text files stored by your browser. We use them for sessions, security and remembering your choices. Cookies outside the necessary and functional categories load only if you consent.',
            ],
          },
          {
            heading: '2. Categories',
            paragraphs: ['We group cookies into four categories:'],
            bullets: [
              'Necessary: sign-in, CSRF protection and remembering your cookie choice.',
              'Functional: remembers choices for tools you explicitly start (e.g. Pilot Dossier); treated as falling within the ePrivacy exemption for a service you requested.',
              'Analytics: page and search metrics, only with consent.',
              'Marketing: advertising or affiliate tracking pixels. Currently unused; if added, only with consent.',
            ],
          },
          {
            heading: '3. Cookie Table',
            paragraphs: ['Primary cookies:'],
            bullets: [
              'authjs.session-token (production: __Secure-authjs.session-token) — necessary — session — session lifetime.',
              'authjs.csrf-token (production: __Secure-authjs.csrf-token) — necessary — CSRF protection — session lifetime.',
              'fpv_consent — necessary — cookie choice — 1 year.',
              'fpv_dossier_v1 — functional — remembers your Pilot Dossier choices — 1 year, when you use Academy/Dossier features.',
              '_ga, _ga_* — analytics — Google Analytics — only with consent, up to 2 years.',
              'Retailer cookies — marketing — set by the affiliate retailer after you click — retailer policy.',
            ],
          },
          {
            heading: '4. Managing Choices',
            paragraphs: [
              'Use the “Cookie Preferences” link in the footer to change categories. You can also delete or block cookies in your browser; blocking necessary cookies may break sign-in.',
            ],
          },
          {
            heading: '5. Third-Party Cookies',
            paragraphs: [
              'Affiliate links take you to a retailer’s site, where that retailer’s cookies and policy apply. We do not run third-party advertising pixels on this site.',
            ],
          },
          {
            heading: '6. Withdrawing Consent',
            paragraphs: [
              'You can withdraw consent by changing your cookie preferences or deleting cookies. Withdrawal does not affect the lawfulness of prior processing.',
            ],
          },
        ],
      },
      terms: {
        key: 'terms',
        title: 'Terms of Service',
        description: 'Terms for using FPVLovers, including pilot responsibility, intellectual property and liability limits.',
        updated: LEGAL_DOCUMENT_VERSION,
        sections: [
          {
            heading: '1. Acceptance',
            paragraphs: [
              'By using fpvlovers.com.tr you agree to these terms. If you do not agree, do not use the site or its tools.',
            ],
          },
          {
            heading: '2. Nature of the Service',
            paragraphs: [
              'FPVLovers is an educational knowledge platform, not an e-commerce store. We do not sell hardware, hold stock or operate a price comparison engine. Content is informational.',
            ],
          },
          {
            heading: '3. Pilot Responsibility and Safety',
            paragraphs: [
              'FPV flight and hardware assembly carry electrical, physical and legal risk. Calculator, PID/blackbox and part-matcher output is educational. You are responsible for verifying components, wiring and solder joints and for complying with SHGM/SHY, FAA and local rules.',
            ],
          },
          {
            heading: '4. Intellectual Property',
            paragraphs: [
              'Guides, calculators, layouts and graphics are copyrighted. You may use them for personal learning and local builds; commercial automated scraping or reproduction requires written permission.',
            ],
          },
          {
            heading: '5. Commercial Links',
            paragraphs: [
              'Some product links may be affiliate or sponsored. Commercial links are labeled and do not determine editorial conclusions. See the Affiliate Disclosure page for details.',
            ],
          },
          {
            heading: '6. Limitation of Liability',
            paragraphs: [
              'FPVLovers, its developers and contributors are not liable for direct, indirect, incidental or consequential damages arising from use of the tools or guides. Tools are provided “as is”.',
            ],
          },
          {
            heading: '7. Account Security',
            paragraphs: [
              'You are responsible for keeping your account credentials confidential. Report unauthorized access to hello@fpvlovers.com.tr.',
            ],
          },
          {
            heading: '8. Governing Law',
            paragraphs: [
              'These terms are governed by the laws of the Republic of Türkiye. Mandatory consumer rights remain unaffected.',
            ],
          },
          {
            heading: '9. Contact',
            paragraphs: [`Questions: ${controller.email}. Data controller: ${controllerLine(controller, 'en')}.`],
          },
        ],
      },
    },
  };
}

export function getLegalDocument(
  locale: 'tr' | 'en',
  key: 'privacy' | 'cookies' | 'terms' | 'kvkk',
  controller: LegalController,
): LegalDocument {
  const docs = buildLegalDocuments(controller)[locale];
  const document = (docs as Record<string, LegalDocument | undefined>)[key];
  if (!document) throw new Error(`Missing ${locale} legal document: ${key}`);
  return document;
}
