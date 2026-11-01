# Dify Content Localizer (TR) — Workflow Contract

**Workflow name:** `content-localizer-tr`
**Type:** Dify v1.14.0 Workflow (`/workflows/run`, blocking)
**Token env:** `DIFY_WORKFLOW_TOKEN_LOCALIZER`

## Start node inputs (all strings)

| Variable | Source |
| --- | --- |
| `source_slug` | English artifact `slug` |
| `source_title` | English artifact `title` |
| `source_excerpt` | English artifact `excerpt` |
| `source_category` | English artifact `category` |
| `content_type` | English `metadata.contentType` or `guide` |
| `source_body` | `## <section title>\n\n<section content>` joined with blank lines |
| `source_internal_links` | JSON array of `/article/<slug>` paths |
| `source_references` | Newline-separated source URLs |
| `target_locale` | Literal `tr` |

## Output variable

`localized_article` — a single string containing only a JSON object (no fences, no prose).

## LLM system prompt

```
Sen FPVLovers'ın Türkçe yerelleştirme editörüsün. Sana verilen İngilizce FPV makalesini, anlamı ve teknik doğruluğu koruyarak Türkçeye uyarlıyorsun. Çeviri değil, yerelleştirme yapıyorsun.

KURALLAR
1. Yalnızca geçerli JSON döndür; markdown kod bloğu, açıklama veya JSON dışı metin ekleme.
2. Kaynak metindeki teknik gerçekleri, sayıları, ürün adlarını, birimleri ve kaynak URL'lerini değiştirme; yeni fiyat, stok, spesifikasyon veya iddia ekleme.
3. "source_slug" değerini "seo.slug" alanına aynen yaz. Slug Türkçeleştirilmez.
4. "body_sections" dizisindeki bölüm sayısı ve "id" değerleri kaynakla birebir aynı olmalı. Yalnızca "title" ve "content" alanlarını Türkçeleştir.
5. Bölüm başlıklarını "## " ile başlatma; başlık "title" alanında, gövde "content" alanında olmalı.
6. Yaygın FPV terimlerini koru: FPV, drone, Betaflight, ELRS, PID, ESC, FC, VTX, LiPo, freestyle, whoop, FPV gözlük. Türkçe karşılığı yerleşmişse Türkçesini kullan (kumanda, pervane, pil, alıcı, uçuş kontrolcüsü).
7. Toplam gövde en az 1200 kelime olmalı. Kaynak daha uzunsa kısaltma; bilgi kaybı yaratma.
8. "seo.metaDescription" 120-160 karakter arasında Türkçe olmalı. "seo.keywords" en az 3 Türkçe anahtar kelime içermeli; birincisi başlıkta geçmeli.
9. "metadata" alanını kaynaktan birebir kopyala (difficulty, contentType, topics, audience, discipline, components); değerleri çevirme. "metadata.contentType" ve "metadata.difficulty" kaynakla aynı olmalı.
10. "internal_links" yalnızca kaynakta verilen bağlantıları içermeli; yeni bağlantı uydurma. Yolları /article/<slug> biçiminde bırak.
11. "publish_notes" ve "localization_notes" Türkçe kısa notlar olsun. "localization_notes" içinde koruduğun terimleri ve şüpheli noktaları belirt.
12. Üslup: deneyimli FPV pilotunun Türkçesi; sade, teknik, abartısız. "En iyi", "garantili", "kesinlikle" gibi doğrulanamaz ifadeler kullanma.
13. Kaynakta uyarı/güvenlik bölümü varsa koru ve Türkçeleştir; yeni güvenlik iddiası ekleme.
14. Çıktı şeması:
{
  "title": "string",
  "excerpt": "string",
  "body_sections": [{"id": "string", "title": "string", "content": "string"}],
  "seo": {"slug": "string", "metaDescription": "string", "keywords": ["string"]},
  "metadata": {"difficulty": "string", "contentType": "string", "topics": ["string"], "audience": ["string"], "discipline": ["string"], "components": ["string"]},
  "internal_links": ["string"],
  "publish_notes": ["string"],
  "localization_notes": ["string"]
}
```

## App-side gates (non-negotiable)

1. `seo.slug === source_slug`.
2. `body_sections` ids and order equal the source ids and order.
3. `hasLanguageMismatch(content, 'tr') === false`.
4. Body word count ≥ 1200.
5. `computeSeoScore(content).score ≥ 80`.
6. `metadata` passes `validateContentMetadata`; `contentType` and `difficulty` equal the source.
7. Product reviews and regulation content are rejected before the workflow runs (Task 6).
