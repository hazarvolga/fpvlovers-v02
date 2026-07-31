# 🚁 FPVLovers.com.tr · Yapay Zeka & Otomasyon Mimarisi Rehberi

**Proje:** `fpvlovers.com.tr` (FPV E-Ticaret, İçerik & Topluluk Portalı)  
**Tarih:** 30 Temmuz 2026  
**Konu:** Dify vs AutoGPT Rol Dağılımı, RAG Mimarisi ve Gelecek Otomasyon Stratejisi  

---

## 📌 1. Özet & Temel Strateji

`fpvlovers.com.tr` e-ticaret ve topluluk portalında halihazırda kurulmuş ve kullanılan **Dify** sistemi, müşteri etkileşimi ve web sitesi için **en doğru ve değiştirilmemesi gereken** ön büro motorudur. 

AutoGPT veya benzeri otonom (autonomous) ajanlar Dify'ın yerini **alamaz**, ancak arka planda Dify veritabanını (RAG) besleyen ve pazar araştırması yapan bir **arka büro işçisi** olarak entegre edilebilir.

---

## 🏛️ 2. İki Sistem Arasındaki Rol Dağılımı

```text
┌────────────────────────────────────────────────────────────────────────┐
│                      FPVLOVERS.COM.TR EKOSİSTEMİ                       │
├──────────────────────────────────────┬─────────────────────────────────┤
│    🤖 AutoGPT (Arka Büro İşçisi)     │   💬 Dify (Ön Büro Müşteri Temsilcisi)│
├──────────────────────────────────────┼─────────────────────────────────┤
│ • Rakip FPV sitelerindeki fiyatları  │ • Sitedeki müşterilere canlı    │
│   her gün otomatik tarar.            │   teknik destek verir.          │
│ • Yeni çıkan FPV ürünlerinin         │ • Ürün önerir ve stok bilgisi   │
│   teknik detaylarını toplar.         │   paylaşır.                     │
│ • Çektiği verileri Dify'ın RAG       │ • Dify veritabanındaki (RAG)    │
│   veritabanına otomatik aktarır. ───►│   güncel bilgiyi müşteriye sunar.│
└──────────────────────────────────────┴─────────────────────────────────┘
```

---

## 🥊 3. Karşılaştırma Tablosu

| Özellik | **Dify** *(Sitede Aktif Kullanılan)* | **AutoGPT / Otonom Ajanlar** |
| :--- | :--- | :--- |
| **Rolü** | **Ön Büro (Müşteri İlişkileri & Canlı Chatbot)** | **Arka Büro (Otomasyon & Veri Toplama)** |
| **Güçlü Yanı** | **RAG**, Vektör Arama, Doküman İndeksleme, Hızlı REST API | Web Taraması, Otonom Görev Döngüleri |
| **Yanıt Süresi** | Sitedeki müşteriye **anında (1-2 saniye)** yanıt verir. | Arka planda kendi kendine çalışır (Daha yavaştır). |
| **Web Entegrasyonu** | **%100 Mükemmel.** (Next.js sitenize tam uyumludur). | Web sohbet penceresi için uygun değildir. |

---

## 🛠️ 4. Gelecek Otomasyon Senaryoları

### Senaryo A: Otomatik Ürün & Bilgi Bankası (RAG) Güncellemesi
1. **AutoGPT (Arka Büro):** Küresel FPV üreticilerinin (BetaFPV, DJI, Radiomaster) yeni çıkan kart ve motor dokümanlarını otomatik tarar.
2. **Aktarım:** Çektiği teknik verileri özetler ve Dify bilgi bankasına yükler.
3. **Dify (Ön Büro):** Müşteri `fpvlovers.com.tr` canlı sohbetinde yeni çıkan motoru sorduğunda Dify güncel veriden anında yanıt döner.

### Senaryo B: FPV Mobil Uygulama Planlaması (Flutter)
- **Web Portalı (`fpvlovers.com.tr`):** SEO, Google organik trafiği ve e-ticaret için **Next.js 15** mimarisinde kalır.
- **Mobil Uygulama (iOS / Android):** Anlık Push Notification ve yağ gibi akan UI için **Flutter** ile geliştirilir ve Dify API'larına bağlanır.

---

## 📝 5. Notlar & Karar Kaydı
- [x] `fpvlovers.com.tr` web sitesinde **Dify** altyapısına devam edilecek.
- [x] AutoGPT veya benzeri otonom sistemler yalnızca arka plan veri beslemesi için düşünülecek.
- [x] Web tarafında SEO kaybı yaşamamak için Next.js 15 SSR mimarisi korunacak.
