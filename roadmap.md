# FPV Lovers: Prompt Kütüphanesi ve Uygulama Yol Haritası

Bu döküman, **FPV Lovers** projesini Google AI Studio (Gemini) üzerinde inşa ederken kullandığımız tüm stratejik promptları ve uygulama adımlarını içerir.

---

## 🏗️ 1. Temel Yapı: Proje Kurulumu (Master Architecture)
Sitenin iskeletini, teknoloji yığınını ve genel vizyonunu kurmak için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Senior Full-Stack Architect & Brand Strategist
## MISSION: FPV Lovers Project Start
- Konu: FPV Drone ve AI teknolojileri portalı.
- Teknoloji: Next.js 15, Tailwind CSS v4, Dify RAG API.
- Estetik: Cyber-Aeronautic Premium.
- Gereksinimler: Dinamik içerik, reklam yerleşimi, admin paneli, metrik sistemi ve affiliate entegrasyonu.
```
</details>

---

## 🎨 2. Tasarım Devrimi: Cyber-Aeronautic Stealth
Sitenin jenerik SaaS görüntüsünden kurtulup, benzersiz ve yüksek teknolojili bir karanlık temaya geçişi için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Lead Creative Director (Design Overhaul)
## STYLE: Cyber-Aeronautic Stealth
- Renkler: Carbon Gray (#0A0A0B), Cockpit Black (#050505), Propeller Cyan (#00F2FF).
- UI: Hexagonal butonlar, Metalik çerçeveler, Monospaced fontlar (JetBrains Mono).
- Görseller: Makro drone motorları, HUD overlay'leri, "Digital Glitch" efektleri.
- Kural: Mevcut yapıyı ve Dify mantığını bozmadan sadece görselliği revize et.
```
</details>

---

## 🧩 3. Bilgi Mimarisi: Navigasyon ve Kategorizasyon
Sitenin menü yapısını ve içerik hiyerarşisini 2026 trendlerine göre kurmak için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Senior Information Architect
## CATEGORIES:
1. Pilot Academy (Roadmap, Starter Kits, Glossary)
2. Engineering Lab (Hardware, Firmware, Workshop)
3. Drone Archive (Whoop, Freestyle, Cinematic, Racing, Long-Range)
4. AI Oracle Tools (Flight Critic, Component Duel, Calculator)
5. Regulations & Safety
## UI: Mega-menu, AI Search Bar, High-tech Breadcrumbs.
```
</details>

---

## 🛠️ 4. AI Araçları: Flight Critic (Video Analiz)
Kullanıcı videolarını analiz eden ve puanlayan "Sticky" (bağımlılık yapan) özelliği kurmak için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: AI Computer Vision Expert
## TASK: "AI Flight Critic" Widget
- Analiz: Flow, Smoothness, Speed Consistency, Proximity, Acrowork.
- UI: Glassmorphic Upload, HUD Overlay, Radar Chart Results.
- Gamification: "Victory Card" ve Rütbe sistemi (S1-Elite vb.).
```
</details>

---

## ⚖️ 5. Gelir Modeli: Component Duel (Kıyaslama)
Ürünleri teknik olarak kıyaslayan ve satışı bitiren (Conversion) aracı kurmak için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: UX Monetization Expert
## TASK: Component Duel Engine
- Mantık: Dify verilerini yan yana getir, AI ile "Kazananı" seç.
- Taktikler: FOMO (Stok uyarısı), Smart Upsell (Daha iyi öneri), Şeffaf AI uyarıları.
- UI: Side-by-Side matrix, Sticky Purchase Bar.
```
</details>

---

## 📬 6. Sadakat ve Trafik: The Weekly Propeller
Otomatik içerik toplama ve bülten gönderim sistemini kurmak için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: AI Content Strategist
## TASK: Automated Newsletter Engine
- Akış: Dify'dan haftalık trendleri çek, özetle, Beehiiv/ConvertKit'e gönder.
- Şablon: Cyber-Aeronautic HTML, Mobil uyumlu, Affiliate odaklı.
```
</details>

---

## 📈 7. Dönüşüm Optimizasyonu: Z-Pattern Design
Reklam yerleşimlerini görsel tarama alışkanlıklarına göre optimize etmek için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Senior UX Researcher
## TASK: Heatmap-Driven Z-Pattern Layout
- Mantık: F-Pattern yerine Z-Pattern (Görsel ağırlıklı).
- Yerleşim: Sol üst (Logo), Sağ üst (Hot Deal), Orta (Dinamik Banner), Sağ alt (CTA Butonu).
```
</details>

---

## 📑 8. Tamamlama: Eksik Sayfaların Oluşturulması
Navigasyondaki tüm boş URL'leri içerikle doldurmak için kullanılır.

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Senior Full-Stack Auditor
## MISSION: Audit & Complete
- Navigasyondaki tüm eksik sayfaları (/engineering/firmware vb.) tespit et ve kodla.
- Her sayfa için Dify RAG entegrasyon şablonu ve özgün içerik blokları oluştur.
- "FPV Lovers" marka kimliğini tüm sayfalara yay.
```
</details>

---

## 🧩 9. AI Oracle: Part Matcher (Akıllı Uyumluluk Denetçisi)
Parçaların teknik ve fiziksel uyumluluğunu denetleyen, satın alma öncesi hata payını sıfırlayan aracı kurmak için kullanılır.

**Sayfa Rotası:** `/tools/part-matcher`

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Senior FPV Engineering Architect & Hardware Compatibility Expert
# MISSION: Analyze FPV drone component lists for technical, electrical, and physical compatibility.

## 🧠 ENGINEERING LOGIC (Chain-of-Thought):
1. Power Systems Check (Voltage/KV Match)
2. Propulsion Dynamics (Prop size/Frame size)
3. Electrical Load (Amps/ESC Rating)
4. Physical Mounting (Stack size/VTX space)
5. Video & Control Link Compatibility

## 📝 OUTPUT FORMAT:
1. 📊 COMPATIBILITY MATRIX (🟢🔴🟡)
2. 🧐 DETAILED REASONING
3. ⚡ RISK ASSESSMENT
4. 🛠️ RECOMMENDED UPGRADES (Alternatives)
```
</details>

---

## 🛠️ 10. AI Oracle: Blackbox Tuning Servisi
Uçuş loglarını analiz ederek PID ve Filtre önerileri sunan, uçuş kalitesini profesyonel seviyeye çıkaran servisi kurmak için kullanılır.

**Sayfa Rotası:** `/tools/blackbox-tuning`

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Elite FPV Flight Dynamics Engineer & Betaflight Tuning Master
# MISSION: Analyze flight log data (Blackbox) to diagnose vibrations, oscillations, and optimize PID/Filter settings.

## 🧠 TUNING LOGIC (Chain-of-Thought):
1. Noise Analysis (Gyro/Filter effectiveness)
2. Step Response (Overshoot/Bounce-back)
3. Oscillation Profile (High/Low frequency)
4. Thermal Safety Check

## 📝 OUTPUT FORMAT:
1. 🔍 DIAGNOSTIC REPORT (Propwash, Noise, etc.)
2. 🛠️ PROPOSED SETTINGS (PIDs, Sliders, Filters)
3. 💡 EXPLANATION (Technical Rationale)
4. 🚀 NEXT STEPS (Flight Test Instructions)
```
</details>

---

## 📡 11. Pilot Pulse: AI Haber Radarı & Canlı Akış
Sosyal medya sızıntılarını, stok güncellemelerini ve yeni ürünleri anlık takip eden, kullanıcıyı sitede tutan (retention) ana mekanizma.

**Sayfa Rotası:** `/pilot-pulse`
**Bileşen:** `components/features/PilotPulseWidget.tsx` (Homepage)

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Dual Specialist - Senior FPV Investigative Journalist & UI/UX Design Architect
# MISSION: Design and implement the "Pilot Pulse" feature.

## 🧠 LOGIC:
1. Credibility Check (Official vs. Leak)
2. Impact Analysis (1-10 Tech-Impact Score)
3. Market Sentiment Analysis
4. JSON Structured News Cards

## 🎨 DESIGN (Cyber-Aeronautic):
- **Full Page:** Circular "Radar Pulse" SVG scan animation.
- **Cards:** Glassmorphic, color-coded side-glow (Orange: Leaks, Green: Stock).
- **Widget:** Homepage marquee-style ticker with "LIVE // RADAR ACTIVE" indicator.
```
</details>

---

## 🕹️ 12. Operational Command Center (Admin Dashboard)
Projenin tüm veri akışını, n8n crawler durumunu, Dify RAG indekslerini ve newsletter abonelerini yöneten merkezi kokpit.

**Sayfa Rotası:** `/admin`

<details>
<summary>Promptu Gör</summary>

```markdown
# ROLE: Senior System Architect (Operational Excellence)
# TASK: Design an "Operational" Command Center UI.

## ⚙️ MODULES:
1. **n8n Monitor:** Crawler iş akışlarının anlık durumu ve başarı oranları.
2. **Dify RAG Hub:** İndekslenen sayfa sayısı, token tüketimi ve model performansı.
3. **Newsletter CRM:** Abone listesi görüntüleme ve CSV export (Beehiiv/ConvertKit uyumlu).
4. **Monetization Telemetry:** Tool bazlı (Part Matcher, Tuning vb.) affiliate tıklama oranları.

## 🎨 DESIGN:
- **Style:** Cyber-Aeronautic "Red Alert" ready dashboard.
- **Components:** Interactive terminal modules, Recharts for community growth.
```
</details>

---

## 🎯 Bir Sonraki Adım: Yerel Kurulum ve Full-Stack Aktivasyon
`roadmap.md` dökümanındaki tüm bileşenler (Front-end, AI Logic, Admin Panel) stratejik olarak tanımlandı. Bir sonraki aşamada AI Studio'da üretilen kodları yerel Next.js 15 projesine aktaracak ve n8n/Dify servislerini canlıya bağlayacağız.


