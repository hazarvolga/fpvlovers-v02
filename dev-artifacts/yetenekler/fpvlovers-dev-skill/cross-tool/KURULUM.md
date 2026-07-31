# FPVLovers Dev Assistant — Kurulum Rehberi

## Claude (Cowork / Claude Code)
`fpvlovers-dev-skill.skill` dosyasını Claude'a yükle:
- **Cowork:** Sohbet penceresinde skill dosyasına tıkla → "Install Skill"
- **Claude Code:** `claude install fpvlovers-dev-skill.skill`

## OpenCode
Proje kökündeki `AGENTS.md` dosyasına `opencode-codex-append.md` içeriğini ekle:
```bash
cat opencode-codex-append.md >> /path/to/fpv-autoblog-v2/AGENTS.md
```

## Codex CLI (OpenAI)
İki seçenek:
```bash
# Seçenek A — Global (tüm projelerde aktif)
cat opencode-codex-append.md >> ~/.codex/instructions.md

# Seçenek B — Proje bazlı
cat opencode-codex-append.md >> /path/to/fpv-autoblog-v2/AGENTS.md
```

## Kiro (AWS)
```bash
mkdir -p /path/to/fpv-autoblog-v2/.kiro/steering
cp kiro-steering.md /path/to/fpv-autoblog-v2/.kiro/steering/fpvlovers.md
```
Kiro `.kiro/steering/*.md` dosyalarını her oturumda otomatik yükler.

## Gemini CLI / Google AntiGravity
```bash
# Proje kökünde GEMINI.md olarak kopyala
cp gemini-antigravity.md /path/to/fpv-autoblog-v2/GEMINI.md
```
veya Gemini CLI'nin `--system-prompt` parametresiyle kullan.

## Cursor / Windsurf / Diğer IDE'ler
`SYSTEM_PROMPT.md` içeriğini aracın "Rules" veya "System Prompt" alanına yapıştır.

## Evrensel (Herhangi Bir Araç)
`SYSTEM_PROMPT.md` → aracın sistem prompt / custom instructions alanına yapıştır.
