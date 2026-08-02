# Deploy Handoff — 2026-08-02

Bu oturumda yapılanların ve senin şu an yaptığın deploy sonrası kontrol etmen gerekenlerin özeti. `2026-08-01-comprehensive-platform-audit.md` ve `2026-08-01-manual-steps-handoff.md` dosyalarının devamı/güncel özeti niteliğinde — o dosyalardaki madde numaraları burada da referans alınıyor.

---

## Bu oturumda yapılan kod değişiklikleri (hepsi ayrı commit, main'e push edildi)

| Commit | Ne |
|---|---|
| `3229124` | `retrieval-orchestrator.ts`'deki `realRetrieval()` bug'ı düzeltildi (yanlış endpoint `/document/search` → doğru `/datasets/{id}/retrieve`); Part Matcher, Build Wizard, Blackbox Tuning, Flight Critic (`/api/analyze-flight`) route'ları yeni `retrieval-grounding.ts` katmanı üzerinden orchestrator'a bağlandı |
| `6ef6465` | İlk manuel-adımlar handoff dokümanı |
| `bb502d1` | SSH ile canlı doğrulama sonrası güncelleme (Dataset key ve `ENABLE_REAL_RAG` zaten doğruydu; Coolify auto-deploy'un çalışmadığı bulundu) |
| `48c9921` | Madde 2, 3, 5 kapatıldı; anahtar rotasyonunun yarı tamamlandığı not edildi |

Hepsi typecheck + lint + ilgili regresyon testleri (blackbox, part-matcher, build-calculator) yeşil olarak commit edildi, dev server'da canlı curl ile doğrulandı.

## Bu oturumda Dify Studio / SSH üzerinden yapılanlar (kod dışı)

1. **SSH erişimi kuruldu** — `SECRETS-MOVE-OUT-OF-REPO/server-info/` altındaki `ubuntu@<ip>` + `.key` kombinasyonlarıyla üç sunucuya da (161.118.171.201, 80.225.231.62, 141.148.206.187) bağlanıldı.
2. **7 sızdırılmış Dify anahtarı için yeni anahtar oluşturuldu** (eskiler silinmedi, kesinti yok) — `SECRETS-MOVE-OUT-OF-REPO/canli-environtmens-degerleri.md` güncellendi.
3. **"SEO Content Generator" workflow'unun `Article Generator` node'una grounding kuralı eklendi ve publish edildi** — artık canlı, RAG bağlamı boşsa kaynak/istatistik uydurmayı yasaklıyor.
4. **Yan bulgu:** Aynı workflow'daki `RAG Retrieval` node'unun rerank model'i "Incompatible" hale gelmişti (publish'i engelliyordu) — model gerektirmeyen "Weighted Score" moduna çevrilerek düzeltildi.
5. **Graphify graph güncellendi** (`graphify update .`) — 8257 node, 11112 edge, 436 community.

---

## Deploy sonrası doğrulama — TAMAMLANDI (2026-08-02)

Deploy bitti, ben de doğruladım:

- [x] Container yeni commit'in image'ını çalıştırıyor — `r0c44ok0cskc800gs0c8o8wk:48c9921...`, "Up 6 minutes" (redeploy'dan hemen sonra kontrol edildi).
- [x] Production env'inde 7 yeni Dify anahtarının hepsi doğru (fingerprint eşleştirmesiyle SSH üzerinden teyit edildi).
- [x] Part Matcher canlıda test edildi: `retrievalGrade: medium`, `retrievalConfidence: 71`, 4 gerçek kaynak (fpv-components-specs, fpv-build-guides) — orchestrator gerçekten çalışıyor.
- [x] Blackbox Tuning canlıda test edildi: `answerMode: dify_grounded`, `retrievalConfidence: 78`, 5 kaynak — aynı şekilde doğrulandı.
- [x] Dify Studio'ya dönüp **7 ESKİ (sızdırılmış) anahtarın hepsi silindi** (Blackbox, Part Matcher, Build Wizard, FPV Expert Assistant, Community Hub, SEO Content Generator workflow, Dataset API key). Sadece yeni anahtarlar aktif.

**Not:** Part Matcher'ın Dify chat çağrısı (grounding değil, LLM yanıtı) o testte "local" fallback'e düştü — bunun anahtar sorunu OLMADIĞI, sadece Dify'ın yanıt süresinin (basit "ping" testinde bile ~6.5sn) 15sn timeout'a yakın olmasından kaynaklandığı ayrıca doğrulandı (yeni anahtarla düz bir "ping" isteği HTTP 200 döndü). Tasarım gereği güvenli degrade oluyor — kaynak/grounding verisi yine de doğru gösteriliyor.

---

## Kalan açık maddeler (öncelik sırasıyla)

| # | Madde | Öncelik | Durum |
|---|---|---|---|
| 0 | Coolify auto-deploy webhook'u çalışmıyor (GitHub push → otomatik deploy tetiklenmiyor) | CRITICAL | **Hâlâ açık** — kök neden araştırılmadı, elle redeploy ile aşıldı ama bir sonraki push'ta yine elle tetiklemen gerekecek |
| 4 | GitHub repo secret `CRON_SECRET` ekle + eski host crontab'ını kapat | HIGH | Doğrulanamadı |
| 6 | 7 bağlı olmayan Dify workflow DSL'ini import et (opsiyonel) | Düşük | Yapılmadı |

Madde 1, 2, 3, 5 tamamen kapandı.

---

## Referanslar
- Kapsamlı denetim: `docs/gap-reports/2026-08-01-comprehensive-platform-audit.md`
- Önceki oturum handoff'u: `docs/gap-reports/2026-08-01-manual-steps-handoff.md`
- Yeni anahtarlar + talimatlar: `SECRETS-MOVE-OUT-OF-REPO/canli-environtmens-degerleri.md` (repo dışı, gitignored)
