# QR Studio API

Base URL: your backend origin (e.g. `http://127.0.0.1:8000`).

All authenticated routes expect:

```http
Authorization: Bearer <access_token>
```

## Auth

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Body: `{ "email", "password" }` — creates user (no token; use login next) |
| `POST` | `/api/auth/login` | Body: `{ "email", "password" }` — returns `{ access_token, refresh_token, token_type, expires_in }` (seconds) |
| `POST` | `/api/auth/refresh` | Body: `{ "refresh_token" }` — new access token |
| `POST` | `/api/auth/logout` | Body: `{ "refresh_token" }` — revokes refresh token (204) |
| `GET` | `/api/auth/me` | Current user (JWT) |

Access tokens are JWTs with `typ: "access"` and a short lifetime. Refresh tokens are opaque strings stored server-side (hashed).

## QR codes

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/qr/generate` | Create QR (PNG stored; metadata in DB). Body: `display_name`, `folder`, `qr_type` (`static` \| `dynamic`), `content_type`, `payload`, optional `redirect_url` for dynamic |
| `GET` | `/api/qr` | List current user’s QR codes (`?folder=` optional) |
| `GET` | `/api/qr/folders` | Distinct folder names |
| `GET` | `/api/qr/{id}` | Single QR |
| `GET` | `/api/qr/{id}/scans` | Recent scan logs for a dynamic QR |
| `DELETE` | `/api/qr/{id}` | Delete QR and PNG file |

**Static QR:** encodes normalized payload (text, `https://…`, `mailto:`, `tel:`).

**Dynamic QR:** encodes `{PUBLIC_BASE_URL}/r/{public_code}`; opening that URL records a scan and redirects to `redirect_url`.

## Public redirect (no auth)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/r/{public_code}` | 302 redirect to stored URL; logs IP, user agent, device |

## Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/overview` | Totals: QRs, scans, scans last 7 days |
| `GET` | `/api/analytics/qr/{id}/series` | Daily scan counts (last 30 days) for one QR |

## Static files

QR PNG files are served at:

`/static/qrcodes/{user_id}/{public_code}.png`

( Mounted from `backend/storage/`. )

## Health

| Method | Path |
|--------|------|
| `GET` | `/health` |

Full schema: open **`/docs`** on a running server.
