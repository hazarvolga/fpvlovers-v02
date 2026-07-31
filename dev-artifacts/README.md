# Dev Artifacts

Bu klasör, **geliştirme aşamasında kullanılan ama production'a ait olmayan** dosyaları içerir.

## İçindekiler

| Klasör | Açıklama | Boyut |
|--------|----------|-------|
| `AffexAI-Oracle-Servers/` | Oracle sunucu konfigürasyonları (dev ortamı) | 2.1M |
| `design/` | Tasarım dosyaları, mockup'lar, asset'ler | 6.8M |
| `workflows/` | Eski workflow denemeleri, n8n-as-code arşivi | 4.0K |
| `yetenekler/` | AI agent yetenek paketleri (skills, personas) | 160K |

## Neden ayrıldı?

`fpvlovers.com.tr/` (production) ile `fpvlovers.com.tr-main/` (live deployed) klasörleri arasındaki diff analizinde tespit edildi ki bu 4 klasör production kod tabanıyla **doğrudan ilişkili değil**:

- Production build'e dahil edilmiyorlar
- CI/CD pipeline'larından geçmiyorlar
- Live versiyonda (`fpvlovers.com.tr-main/`) bu klasörler **yok**

Production kodunu temiz tutmak için burada arşivlenmiş durumdalar. İhtiyaç halinde referans olarak kullanılabilir, ancak yeni geliştirmeler production kök dizinine (`/`) yapılmalıdır.

## Tarih

2026-07-26 — Yeni bilgisayara geçiş sırasında yapılandırma temizliği kapsamında ayrıldı.
