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

## ŞU AN SEN NE YAPIYORSUN

Coolify'a `canli-environtmens-degerleri.md`'deki 7 yeni Dify anahtarını girip redeploy ediyorsun (auto-deploy webhook'u çalışmadığı için elle tetikleniyor — bkz. aşağıdaki "Açık kalan" madde 0).

## Deploy sonrası kontrol listesi (senin doğrulaman gerekenler)

- [ ] Container yeni commit'in (`48c9921` veya sonrası) image'ını çalıştırıyor mu? (`docker ps` → image tag'i kontrol et)
- [ ] Part Matcher, Build Wizard, Blackbox Tuning, Flight Critic canlıda hatasız çalışıyor mu?
- [ ] Bana haber ver — ancak o zaman Dify Studio'daki 7 ESKİ (sızdırılmış) anahtarı silerim.

---

## Açık kalan maddeler (öncelik sırasıyla)

| # | Madde | Öncelik | Durum |
|---|---|---|---|
| 0 | Coolify auto-deploy webhook'u çalışmıyor (GitHub push → otomatik deploy tetiklenmiyor) | CRITICAL | Açık — kök neden araştırılmadı, şimdilik elle redeploy ile aşılıyoruz |
| 1 | 7 sızdırılmış anahtarın ESKİ halini Dify'dan sil | CRITICAL | Deploy doğrulamasını bekliyor (yukarıya bak) |
| 4 | GitHub repo secret `CRON_SECRET` ekle + eski host crontab'ını kapat | HIGH | Doğrulanamadı |
| 6 | 7 bağlı olmayan Dify workflow DSL'ini import et (opsiyonel) | Düşük | Yapılmadı |

Madde 2, 3, 5 tamamen kapandı (bkz. `2026-08-01-manual-steps-handoff.md`).

---

## Referanslar
- Kapsamlı denetim: `docs/gap-reports/2026-08-01-comprehensive-platform-audit.md`
- Önceki oturum handoff'u: `docs/gap-reports/2026-08-01-manual-steps-handoff.md`
- Yeni anahtarlar + talimatlar: `SECRETS-MOVE-OUT-OF-REPO/canli-environtmens-degerleri.md` (repo dışı, gitignored)
