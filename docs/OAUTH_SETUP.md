# KONFIGURACJA OAUTH - Google i GitHub

## Google OAuth 2.0

### 1. Utworz projekt w Google Cloud Console

1. Idz do: https://console.cloud.google.com/
2. Kliknij "Select a project" -> "New Project"
3. Nazwa projektu: "MadeByU Marketplace"
4. Kliknij "Create"

### 2. Wlacz Google+ API

1. W menu -> "APIs & Services" -> "Library"
2. Szukaj "Google+ API"
3. Kliknij "Enable"

### 3. Utworz OAuth credentials

1. Menu -> "APIs & Services" -> "Credentials"
2. Kliknij "+ CREATE CREDENTIALS" -> "OAuth client ID"
3. Skonfiguruj ekran zgody (Consent Screen):
   - User Type: External
   - App name: MadeByU
   - User support email: twoj@email.com
   - Developer contact: twoj@email.com
   - Save
4. Wroc do Credentials -> "+ CREATE CREDENTIALS" -> "OAuth client ID"
5. Application type: **Web application**
6. Name: "MadeByU Web Client"
7. **Authorized JavaScript origins:**
   ```
   http://localhost:3000
   ```
8. **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/google/callback
   ```
9. Kliknij "CREATE"
10. **SKOPIUJ:**
    - Client ID
    - Client Secret

### 4. Dodaj do .env

```env
GOOGLE_CLIENT_ID=twoj-client-id-tutaj.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-twoj-secret-tutaj
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

---

## GitHub OAuth

### 1. Utworz OAuth App

1. Idz do: https://github.com/settings/developers
2. Kliknij "New OAuth App"
3. Wypelnij:
   - **Application name:** MadeByU Marketplace
   - **Homepage URL:** `http://localhost:3000`
   - **Application description:** Marketplace rekodzielniczych produktow
   - **Authorization callback URL:** `http://localhost:3000/auth/github/callback`
4. Kliknij "Register application"

### 2. Wygeneruj Client Secret

1. Po utworzeniu app, kliknij "Generate a new client secret"
2. **SKOPIUJ OD RAZU** (nie bedziesz mogl zobaczyc ponownie!)

### 3. Dodaj do .env

```env
GITHUB_CLIENT_ID=twoj-github-client-id
GITHUB_CLIENT_SECRET=twoj-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
```

---

## Testowanie

### 1. Uruchom serwer
```bash
npm run dev
```

### 2. Test lokalny

1. Idz do: http://localhost:3000/login
2. Kliknij "Google" lub "GitHub"
3. Zaloguj sie
4. Powinno przekierowac do /dashboard

### 3. Troubleshooting

**Blad: "redirect_uri_mismatch"**
- Sprawdz czy URL w Google/GitHub dokładnie pasuje
- Upewnij sie ze nie ma spacji ani dodatkowych znakow

**Blad: "Access denied"**
- Sprawdz czy App jest "Published" w Google Console
- Sprawdz czy masz wlaczony Google+ API

**Blad: "Client authentication failed"**
- Sprawdz czy CLIENT_ID i CLIENT_SECRET sa poprawne
- Sprawdz czy nie ma cudzyslowow w .env

---

## Produkcja (pozniej)

### Google:
```
Authorized JavaScript origins:
https://twoja-domena.pl

Authorized redirect URIs:
https://twoja-domena.pl/auth/google/callback
```

### GitHub:
```
Homepage URL: https://twoja-domena.pl
Authorization callback URL: https://twoja-domena.pl/auth/github/callback
```

### .env (produkcja):
```env
GOOGLE_CALLBACK_URL=https://twoja-domena.pl/auth/google/callback
GITHUB_CALLBACK_URL=https://twoja-domena.pl/auth/github/callback
APP_URL=https://twoja-domena.pl
NODE_ENV=production
```

---

## NA RAZIE - Bez OAuth

Jesli nie chcesz teraz konfigurowac OAuth, po prostu:

1. **Zostaw puste** w .env:
```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

2. **Przyciski OAuth** beda widoczne ale nie dzialaja
3. **Uzywaj** normalnej rejestracji przez email i haslo

## Mozesz skonfigurowac pozniej! 🎉
