# MadeByU - Marketplace Rekodziel

Platforma do sprzedazy rekodzielniczych produktow z systemem autentykacji OAuth.

## Technologie
- **Backend:** Node.js + Express
- **Widoki:** EJS (szablony)
- **Baza danych:** MySQL (XAMPP)
- **Autentykacja:** JWT + Passport.js
- **OAuth:** Google + GitHub
- **Walidacja:** Express-validator
- **Bezpieczenstwo:** Bcrypt, HttpOnly cookies

## Instalacja

### 1. Zainstaluj zaleznosci:
```bash
npm install
```

### 2. Skonfiguruj baze danych:

**Opcja A: phpMyAdmin (ZALECANE)**
1. Uruchom XAMPP (Apache + MySQL)
2. Otworz http://localhost/phpmyadmin
3. Stworz baze `madebyu`
4. Import -> Wybierz plik `database/schema.sql`

**Szczegoly:** `database/IMPORT_INSTRUCTIONS.md`

### 3. Skonfiguruj .env:

Plik `.env` juz istnieje. Sprawdz ustawienia:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=         # Puste dla XAMPP
DB_NAME=madebyu

JWT_SECRET=zmien-to-w-produkcji
SESSION_SECRET=zmien-to-w-produkcji
```

### 4. (Opcjonalnie) Skonfiguruj OAuth:

**Google + GitHub OAuth** - instrukcje: `docs/OAUTH_SETUP.md`

Jesli pominieto OAuth, logowanie przez email dziala normalnie!

### 5. Uruchom serwer:
```bash
npm run dev
```

### 6. Otworz w przegladarce:
```
http://localhost:3000
```

## Struktura projektu
```
madebyu/
├── config/              # Konfiguracja (DB, Passport, theme)
├── controllers/         # Kontrolery (Auth, Products...)
├── database/            # SQL schema i migracje
├── docs/                # Dokumentacja
├── middleware/          # Middleware (auth, validation...)
├── models/              # Modele (User, Product...)
├── public/              # Pliki statyczne
│   ├── css/             # Style (variables, style, auth)
│   └── js/              # JavaScript frontendu
├── routes/              # Routing (auth, products...)
├── utils/               # Narzedzia pomocnicze
├── views/               # Szablony EJS
└── server.js            # Glowny serwer
```

## Funkcjonalnosci

### ✅ Gotowe:
- [x] **System autentykacji**
  - [x] Rejestracja (email + haslo)
  - [x] Logowanie (email + haslo)
  - [x] OAuth (Google + GitHub) - gotowe do konfiguracji
  - [x] JWT tokens w HttpOnly cookies
  - [x] Walidacja formularzy
  - [x] Password strength indicator
- [x] **Responsywny design** (beżowo-brazowa paleta)
- [x] **Wyszukiwarka** produktow
- [x] **Rozwijane menu** kategorii z podkategoriami
- [x] **System zmiennych CSS** (latwa zmiana kolorow przez admina)
- [x] **Baza danych MySQL** (11 tabel)
- [x] **Dashboard** uzytkownika
- [x] **Role systemu** (user, moderator, admin)
- [x] Animacje i efekty hover

### 📋 W planach:
- [ ] CRUD produktow
- [ ] Upload zdjec
- [ ] Koszyk zakupowy
- [ ] System zamowien
- [ ] Platnosci (Stripe Sandbox)
- [ ] Recenzje i oceny
- [ ] Powiadomienia
- [ ] Panel admina (zmiana kolorow, kategorie)
- [ ] Panel moderatora
- [ ] Wishlist
- [ ] Wyszukiwarka z filtrami

## Endpointy

### Publiczne:
- `GET /` - Strona glowna
- `GET /products` - Lista produktow
- `GET /login` - Formularz logowania
- `GET /register` - Formularz rejestracji

### Autentykacja:
- `POST /auth/register` - Rejestracja
- `POST /auth/login` - Logowanie
- `GET /logout` - Wylogowanie
- `GET /auth/google` - Logowanie przez Google
- `GET /auth/github` - Logowanie przez GitHub

### Chronione (wymaga logowania):
- `GET /dashboard` - Panel uzytkownika

### API:
- `GET /css/variables.css` - Dynamiczne CSS variables (z konfigu)

## System kolorow

Wszystkie kolory sa zdefiniowane w `config/theme.config.js` i automatycznie
generowane jako CSS variables. Admin bedzie mogl je zmienic z panelu!

**Dokumentacja:** `docs/COLOR_SYSTEM.md`

## Bezpieczenstwo

- ✅ Hasla hashowane (bcrypt)
- ✅ JWT w HttpOnly cookies
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS protection
- ✅ CSRF protection (sesje)
- ✅ Walidacja inputow (express-validator)
- ✅ Rate limiting (TODO)

## Testowanie

### Test rejestracji:
1. http://localhost:3000/register
2. Wypelnij formularz
3. Powinno przekierowac do /dashboard

### Test logowania:
1. http://localhost:3000/login
2. Zaloguj sie utworzonym kontem
3. Dashboard powinien pokazac dane uzytkownika

### Test OAuth (jesli skonfigurowane):
1. Kliknij "Google" lub "GitHub" na /login
2. Zaloguj sie przez OAuth provider
3. Powinno utworzyc konto i przekierowac do /dashboard

## Troubleshooting

### Blad polaczenia z baza:
```
✗ Blad polaczenia z baza danych
```
**Rozwiazanie:**
- Sprawdz czy MySQL dziala w XAMPP
- Sprawdz .env (DB_HOST, DB_USER, DB_NAME)
- Sprawdz czy baza `madebyu` istnieje

### Blad OAuth:
```
redirect_uri_mismatch
```
**Rozwiazanie:**
- Zobacz `docs/OAUTH_SETUP.md`
- Sprawdz URL callback w Google/GitHub console

### Blad JWT:
```
Sesja wygasla
```
**Rozwiazanie:**
- Sprawdz JWT_SECRET w .env
- Wyloguj sie i zaloguj ponownie

## Contribution

Projekt w fazie rozwoju. 

## Licencja

MIT
