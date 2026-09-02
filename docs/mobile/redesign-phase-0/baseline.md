# Redesign Faz 0 — Baseline

Snapshot tarihi: 2026-07-29.

## Kaynak bazlı görsel baseline

- Owner: kalıcı bottom navigation/top bar yok; dashboard kartları route linki.
- Portal: standart Expo Router tab bar; owner ile ortak shell dili yok.
- Formlar: feature ekranlarının içinde inline; modal route foundation yok.
- Toast: ekran akışı içinde inline kutu; global overlay queue yok.
- Language ve files: bağımsız owner route; hedef tasarımda Settings altına taşınacak.

Gerçek authenticated screenshot otomasyonu, gerekli feature API route'ları web
repository'sinde henüz bulunmadığı için bu fazda sahte veriyle üretilmedi. Faz 2
component gallery ve Faz 5 gerçek dashboard API gate'iyle görsel regression
fixture'ları alınacak.

## Erişilebilirlik baseline

- `Screen`, scroll ekranlarında iOS automatic keyboard inset,
  `KeyboardAvoidingView`, interactive/on-drag dismiss ve handled taps kullanıyor.
- Ortak button minimum 48x48 hedef ve busy/disabled state sağlıyor.
- Static release gate font scaling'in kapatılmasını ve semantiksiz Pressable'ı
  reddediyor.
- Eksik: modal focus trap/restore, maksimum font manuel matrisi ve relation-picker
  semantiği. Bunlar Faz 2–4 gate'idir.

## Performans baseline

Mevcut executable budget'lar `cold-shell`, `warm-shell` ve dashboard render
örneklerini denetliyor. Yeni public akış yalnız bir discovery/session bootstrap
operasyonu yapıyor; domain input veya pairing state'i render etmiyor. Native cihaz
cold/warm ölçüm matrisi Faz 12 release gate'idir.
