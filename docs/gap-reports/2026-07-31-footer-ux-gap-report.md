# Footer UX / UI / Mobile Compatibility — GAP Report
**Tarih:** 2026-07-31  
**Dosya:** `src/features/layout/components/SiteFooter.tsx`  
**Analiz:** Frontend Design skill (DFII framework)

---

## Mevcut Durum Özeti

### Aesthetic Direction
**"Aerospace Dark"** — `#09090b` zemin, `carbon-grid` doku, `#ff3131` kırmızı aksan, `font-mono uppercase tracking-widest` tipografi. Tasarım tutarlı ve site kimliğiyle uyumlu.

### DFII Skoru (Mevcut Durum)
| Boyut | Skor | Not |
|---|---|---|
| Aesthetic Impact | 3/5 | Tutarlı ama template'e yakın |
| Context Fit | 4/5 | FPV tech kitlesi için uygun |
| Implementation Feasibility | 5/5 | Sade, saf HTML/CSS |
| Performance Safety | 5/5 | Sıfır JS, statik |
| Consistency Risk | 2/5 | Site ile uyumlu |
| **DFII** | **15** | Tasarım yönü sağlam — **sorunlar UX/mobile katmanında** |

---

## GAP Bulguları

### GAP #1 — CRITICAL | Mobil Dokunma Hedefleri Çok Küçük

**Konum:** Nav linkleri (`space-y-3`), alt bar linkleri (`text-[10px]`)

**Sorun:**
- Nav linkleri dikey padding'siz: `<li>` içinde sadece `text-xs` link. Dokunma hedefi ~18px yüksek — WCAG 2.1 minimum 44×44px standardının çok altında.
- Alt bar'daki 9 legal link `text-[10px]` ile `gap-x-5` aralıklı — mobilde parmak ile doğru linke basmak neredeyse imkânsız.

**Etki:** 375px iPhone'da footer linkleri işlevsiz sayılır.

**Düzeltme:** Nav `<li>` linklere `py-2 block` ekle. Alt bar linklere `py-1 px-0.5` ekle.

---

### GAP #2 — HIGH | 9 Legal Link Mobilde Kaotik Sarmalanıyor

**Konum:** Alt bar `flex-wrap gap-x-5 gap-y-2` içindeki 9 link

**Sorun:**
- Privacy, Terms, Editorial Policy, Affiliate Disclosure, Advertise, Contact, Sitemap, Regulations, Glossary — tek düz satırda, sarmala bırakılmış.
- 375px'de rastgele 3-4 satıra dağılıyor, herhangi bir gruplama olmaksızın.
- "Advertise" ve "Sitemap" gibi tamamen farklı amaçlı linkler yan yana.

**Etki:** Legal/navigasyon hiyerarşisi okunaksız, kullanıcı aradığını bulamıyor.

**Düzeltme:** Linkleri 3 semantik gruba ayır: Legal (Privacy, Terms, Disclosure) · Platform (Editorial Policy, Regulations, Glossary) · Connect (Advertise, Contact, Sitemap). Mobilde her grup ayrı satır.

---

### GAP #3 — HIGH | 2 Boş Nav Grubu Sahte Sütun Oluşturuyor

**Konum:** `navigationData.ts` — 2 grup `items: []`

**Sorun:**
- "Race" ve başka bir grup `items: []` ile geliyor.
- Footer'da bu gruplar için yalnızca başlık (section header) render ediliyor, altında hiç link yok.
- `xl:grid-cols-5` grid'de bu boş sütunlar hem görsel dengesizlik hem de beyaz boşluk çukuru oluşturuyor.

**Etki:** Kullanıcı bir başlık görüyor, üstüne tıklıyor, section'a gidiyor ama footer'da altında hiç içerik ipucu yok.

**Düzeltme:** `items` uzunluğu 0 olan grupları footer'dan filtrele (`footerGroups.filter(g => g.items.length > 0)`). Veya placeholder "Coming soon" item ekle.

---

### GAP #4 — HIGH | Disclosure Bandı Tıklanamaz

**Konum:** Info strip, orta sütun: `<div className="flex items-center gap-2 md:justify-center">`

**Sorun:**
- `ShieldCheck` ikonu ve "Disclosure and review standards" metni bir `div` içinde — tıklanamaz.
- Kullanıcı bu metni tıklıyor, hiçbir şey olmuyor. Disclosure sayfası (`/disclosure` veya `/editorial-policy`) zaten mevcut.

**Etki:** Kullanıcı güven sinyali arıyor, tıklıyor, sayfada kalıyor → güvensizlik.

**Düzeltme:** `<div>` → `<Link href="/editorial-policy">` ile değiştir, hover state ekle.

---

### GAP #5 — MEDIUM | WCAG Kontrast — `zinc-600` `text-[10px]`

**Konum:** Alt bar copyright ve nav link metinleri

**Sorun:**
- `text-zinc-600` (#52525b) üzerine `#09090b` zemin: kontrast oranı ~2.8:1.
- WCAG AA minimum: normal metin için 4.5:1, büyük metin için 3:1.
- `text-[10px]` bu eşiği küçük metin kategorisine koyuyor → 4.5:1 gerekli → **WCAG AA başarısız**.

**Etki:** Görme güçlüğü yaşayan kullanıcılar alt bar içeriğini okuyamıyor.

**Düzeltme:** Alt bar metni `zinc-600` → `zinc-400` (kontrast ~5.4:1).

---

### GAP #6 — MEDIUM | Sosyal Medya Linkleri Eksik

**Konum:** Logo/tagline bölümü, sol sütun

**Sorun:**
- FPV topluluğu YouTube, Discord, Instagram ve Facebook grupları üzerinden organize oluyor.
- Footer'da tek iletişim kanalı `hello@fpvlovers.com.tr` email.
- Rakip FPV platformlarının tamamında footer'da sosyal linkler var.

**Etki:** Ziyaretçiyi topluluğa yönlendirme fırsatı kaçırılıyor. SEO açısından da sosyal sinyaller zayıf.

**Düzeltme:** Logo altına `YouTube · Discord · Instagram` icon linkleri ekle (varsa hesaplar). Yoksa bu GAP ileriki aşama için işaretlenmeli.

---

### GAP #7 — MEDIUM | Featured Linkler Mobilde Gömülüyor

**Konum:** Sol sütundaki 2×2 `featuredLinks` grid

**Sorun:**
- DOM sırası: Logo → Tagline → Featured Links → Nav Groups.
- Mobilde nav grupları `lg:grid-cols-[1.1fr_1.9fr]` yerine tek kolon oluyor.
- Kullanıcı mobilde sayfayı aşağı kaydırır → önce büyük nav grubu bloğuyla karşılaşır → Featured Links'e ulaşmak için aşağı devam etmek gerekir.

**Gerçek DOM sırası mobilde:**
```
Logo & tagline
Featured Links (Build Calc, Part Matcher...) ← GÖRÜNÜR
Nav Columns (Learn, Build, Race, Fly...) ← UZUN BLOK
Info Strip
Legal Bar
```
- Aslında Featured Links DOM'da üstte — bu doğru.  
- Ancak featured linkler `max-w-md` kısıtlaması nedeniyle 375px'de 2 kolon halinde sıkışıyor; `text-[10px]` icon + truncate kombinasyonu "Part Matcher" gibi isimleri kesiyor.

**Düzeltme:** Featured links'te `text-[10px]` → `text-[11px]`, `truncate` → `line-clamp-1`, mobilde full-width tek kolon.

---

### GAP #8 — LOW | Carbon Grid Görünmez Derecede Soluk

**Konum:** `.carbon-grid` overlay, `opacity-20`

**Sorun:**
- `#09090b` üzerinde `opacity-20` ile carbon grid neredeyse görünmüyor.
- Tasarım amacı doku katmak, ama pratik etkisi yok.

**Düzeltme:** `opacity-20` → `opacity-[0.35]` veya grid'i tamamen kaldır (gereksiz DOM node).

---

### GAP #9 — LOW | Sayfa Başına Dön Butonu Yok

**Konum:** Footer sonu

**Sorun:**
- Uzun makale sayfalarında (FPV rehberleri 1200+ kelime) kullanıcı footer'a kadar scroll ediyor.
- Geri dönmek için sayfayı başa almak zorunda.
- UX best practice: footer'da "back to top" anchor veya sticky butonu.

**Düzeltme:** Footer sağ alt köşesine `<button onClick={scrollToTop}>↑</button>` ekle, `#ff3131` border ile site kimliğiyle uyumlu.

---

### GAP #10 — LOW | Nav Grid Dengesiz Sütun Yükseklikleri

**Konum:** `xl:grid-cols-5` nav grid

**Sorun:**
- 5 sütun var ama item sayısı 0–4 arasında değişiyor (2 grup boş).
- CSS Grid'de eşit sütun genişliği var ama yükseklik farklı → alt baseline eşleşmiyor → görsel titreşim.

**Düzeltme:** Boş grupları filtrele (GAP #3 ile birleşik çözüm) → `xl:grid-cols-3` ya da `xl:grid-cols-4`'e düşer, daha dengeli görünür.

---

## Öncelik Matrisi

| # | Başlık | Öncelik | Efor | Etki |
|---|--------|---------|------|------|
| 1 | Dokunma hedefleri | CRITICAL | S | Kullanılabilirlik |
| 2 | Legal linkler sarmalanması | HIGH | S | Mobil UX |
| 3 | Boş nav grupları | HIGH | XS | Görsel temizlik |
| 4 | Disclosure tıklanamaz | HIGH | XS | Güven / SEO |
| 5 | WCAG kontrast | MEDIUM | XS | Erişilebilirlik |
| 6 | Sosyal medya linkleri | MEDIUM | M | Topluluk / SEO |
| 7 | Featured link truncation | MEDIUM | S | Mobil UX |
| 8 | Carbon grid opacity | LOW | XS | Görsel |
| 9 | Back to top | LOW | S | Kullanılabilirlik |
| 10 | Nav grid dengesizlik | LOW | XS | Görsel |

**Efor:** XS = 15dk, S = 1sa, M = 2-4sa

---

## Sonuç

Footer'ın tasarım yönü ve sistem tutarlılığı sağlam. Kritik sorunlar **UX katmanında**: dokunma hedefleri, kontrast ve tıklanamaz disclosure. Bu 4 CRITICAL/HIGH bulgu bir sprint'te kapatılabilir (toplam ~3 saat efor). Sosyal linkler ise topluluğun varlığına bağlı — önce kanal sahipliğini netleştir.
