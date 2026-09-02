# Redesign Faz 0 teslimi

Faz 0 kapsamı kilitlendi:

- Canonical plan: `docs/neta-mobile-redesign-master-plan.md`.
- Route/API gap snapshot: `route-api-inventory.json`.
- Onaylı liste/detail/create-edit haritası: `flow-map.md`.
- Visual, accessibility ve performance baseline: `baseline.md`.
- Web enum parity: `mobile/src/lib/api/contracts.test.ts` ve feature contract
  testleriyle executable.
- Ticari kayıt, domain-connect, multi-instance UI, pairing ve token-family mobil
  production kodundan kaldırıldı.

Web repository'si bu teslimde yalnız okunmuş, değiştirilmemiştir. Envanterde
"blocked" görünen API grupları gerçek backend delivery olmadan UI'da başarılı
kabul edilmeyecektir.
