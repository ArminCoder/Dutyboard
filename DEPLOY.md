# Deploy — Dutyboard demo

## Environment varijable (obavezno)

```
ACCESS_KEYS=tk:TK-XXXX-XXXX,zdk:ZDK-XXXX-XXXX,ks:KS-XXXX-XXXX,demo:DEMO-2026
SESSION_SECRET=<random 32+ bytes>
TENANTS_FILE=/app/tenants.json
PORT=3000
NODE_ENV=production
```

**Nikad ne komituj `.env` ni `tenants.json`.** `ACCESS_KEYS` je jedina barijera. U produkciji server
odbija start bez `ACCESS_KEYS` i `SESSION_SECRET`.

## Tenanti — jedan ključ po organizaciji

Svaki label iz `ACCESS_KEYS` može imati profil u `tenants.json` (format: `tenants.example.json`):
naziv ministarstva, skraćenica (inicijali u štitu), nazivi PU/PS, grad, centar karte, ulice za
primjere događaja. Ko uđe ključem `tk:…` vidi MUP TK; label bez profila vidi izmišljeni „Demo kanton".

Novi ključ: `echo "XX-$(LC_ALL=C tr -dc 'A-HJ-NP-Z2-9' </dev/urandom | head -c4)-$(LC_ALL=C tr -dc 'A-HJ-NP-Z2-9' </dev/urandom | head -c4)"`

Ko je i kada otvorio demo (label po ključu):

```bash
docker logs dutyboard 2>&1 | grep "pristup odobren"
```

Opozvan ključ (uklonjen iz `ACCESS_KEYS`) ostaje važeći do isteka kolačića (7 dana) — za trenutni
opoziv promijeni i `SESSION_SECRET`.

## Trenutni deploy — dutyboard.online

Droplet `web-main` (46.101.207.209, 1 GB RAM + 2 GB swap), bez Dockera (build ne stane u RAM):
nginx (`/etc/nginx/sites-available/dutyboard.online`, certbot TLS) → systemd servis `dutyboard`
(`node … tsx server/index.ts`, port 3000). Tajne: `/opt/dutyboard/.env` + `tenants.json` (chmod 600);
`TENANTS_FILE=/opt/dutyboard/tenants.json`. Domena na Porkbunu, auto-renew isključen.

Update:

```bash
ssh web-main 'cd /opt/dutyboard && git pull && npm ci && npm run build && systemctl restart dutyboard'
```

Ko je otvorio demo: `ssh web-main 'journalctl -u dutyboard | grep "pristup odobren"'`

## Alternativa: Droplet + Docker + Caddy

```bash
# 1. Kloniraj repo
git clone https://github.com/ArminCoder/Dutyboard.git /opt/dutyboard
cd /opt/dutyboard

# 2. Kopiraj .env i tenants.json sa laptopa (ne commit-uj)
#    scp .env.production.local root@<droplet>:/opt/dutyboard/.env
#    scp tenants.json         root@<droplet>:/opt/dutyboard/tenants.json
chmod 600 .env tenants.json

# 3. Build i pokreni
docker build -t dutyboard .
docker run -d --name dutyboard --restart=always --env-file .env \
  -v /opt/dutyboard/tenants.json:/app/tenants.json:ro \
  -p 127.0.0.1:3000:3000 dutyboard
```

Update kasnije: `git pull && docker build -t dutyboard . && docker rm -f dutyboard && <docker run iznad>`.

Caddyfile (`/etc/caddy/Caddyfile`):

```
demo.tvojadomena.com {
    reverse_proxy 127.0.0.1:3000
    encode gzip
    header {
        X-Frame-Options DENY
        X-Content-Type-Options nosniff
        # ne no-referrer — OSM blokira pločice karte bez Referer-a (403 "Access blocked")
        Referrer-Policy strict-origin-when-cross-origin
    }
}
```

```bash
sudo systemctl reload caddy
```

Caddy auto-TLS uzima certifikat u ~30 sekundi. Server ima `trust proxy = 1` — mora biti tačno jedan
reverse proxy ispred (Caddy/nginx), inače zaključavanje po IP-u ne radi ispravno.

Ako droplet već koristi nginx: `proxy_pass http://127.0.0.1:3000;` + `proxy_set_header X-Forwarded-For
$proxy_add_x_forwarded_for;` u server bloku, pa `certbot --nginx -d demo.tvojadomena.com`.

## Verifikacija nakon deploya

```bash
curl https://demo.tvojadomena.com/healthz         # → ok
curl https://demo.tvojadomena.com/robots.txt      # → Disallow: /
curl -X POST -H "content-type: application/json" \
     -d '{"key":"TK-XXXX-XXXX"}' \
     https://demo.tvojadomena.com/api/auth        # → {"label":"tk","tenant":{...}}
```

Otvori u incognito → Gate → unesi ključ → birač uloge s nazivom ministarstva.

## Preporuke prije prezentacije

- Isprobati cijeli scenarij po `docs/demo-spec.md` „Redoslijed demo prezentacije"
- Testirati na telefonu (P01–P05) i na laptopu (K01/N01/N03/M01)
- Ako se demo pravi na projektoru: uvećati font browsera na 110-125%
- Backup: `npm run dev` na laptopu ako internet padne u sali
