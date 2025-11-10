# ============================================
# INSTRUKCJA: Aktualizacja OAuth Redirect URLs
# ============================================

BACKEND jest teraz na: http://localhost:3001
FRONTEND jest na: http://localhost:5173

Musisz zaktualizować Redirect URIs w:

## 1. GOOGLE CLOUD CONSOLE
https://console.cloud.google.com/apis/credentials

1. Znajdź swoją aplikację OAuth 2.0 Client ID
2. Kliknij Edit (ikona ołówka)
3. W "Authorized redirect URIs" DODAJ:
   http://localhost:3001/api/auth/google/callback
4. Możesz usunąć stary: http://localhost:3000/auth/google/callback
5. Kliknij SAVE

## 2. GITHUB OAUTH APP
https://github.com/settings/developers

1. Znajdź swoją OAuth App
2. Kliknij Edit
3. W "Authorization callback URL" zmień na:
   http://localhost:3001/api/auth/github/callback
4. Kliknij "Update application"

## 3. RESTART BACKEND
Backend musi być zrestartowany aby wczytać nowy .env:
- Naciśnij Ctrl+C w terminalu backendu
- Uruchom ponownie: npm run dev

Po tych zmianach OAuth będzie działał poprawnie!
