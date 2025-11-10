# MadeByU - Marketplace Rękodzieła 🎨# MadeByU - Marketplace Rekodziel



Marketplace dla polskich twórców rękodzieła z systemem motywów kolorystycznych.Platforma do sprzedazy rekodzielniczych produktow z systemem autentykacji OAuth.



## 📋 Wymagania## Technologie

- **Backend:** Node.js + Express

Przed rozpoczęciem upewnij się, że masz zainstalowane:- **Widoki:** EJS (szablony)

- **Baza danych:** MySQL (XAMPP)

1. **Node.js** (wersja 18 lub nowsza)- **Autentykacja:** JWT + Passport.js

   - Pobierz z: https://nodejs.org/- **OAuth:** Google + GitHub

   - Sprawdź czy zainstalowane: `node --version`- **Walidacja:** Express-validator

- **Bezpieczenstwo:** Bcrypt, HttpOnly cookies

2. **XAMPP** (MySQL)

   - Pobierz z: https://www.apachefriends.org/## Instalacja

   - Potrzebny do bazy danych MySQL

### 1. Zainstaluj zaleznosci:

3. **Git** (opcjonalnie, do sklonowania projektu)```bash

   - Pobierz z: https://git-scm.com/npm install

```

---

### 2. Skonfiguruj baze danych:

## 🚀 Instalacja - Krok po kroku

**Opcja A: phpMyAdmin (ZALECANE)**

### 1️⃣ Przygotuj bazę danych1. Uruchom XAMPP (Apache + MySQL)

2. Otworz http://localhost/phpmyadmin

1. Uruchom **XAMPP Control Panel**3. Stworz baze `madebyu`

2. Kliknij **Start** przy **MySQL**4. Import -> Wybierz plik `database/schema.sql`

3. Kliknij **Admin** przy MySQL (otworzy się phpMyAdmin)

4. Stwórz nową bazę danych:**Szczegoly:** `database/IMPORT_INSTRUCTIONS.md`

   - Kliknij "New" po lewej stronie

   - Nazwa: `madebyu`### 3. Skonfiguruj .env:

   - Collation: `utf8mb4_unicode_ci`

   - Kliknij "Create"Plik `.env` juz istnieje. Sprawdz ustawienia:

```env

### 2️⃣ Sklonuj projektDB_HOST=localhost

DB_USER=root

```bashDB_PASSWORD=         # Puste dla XAMPP

git clone https://github.com/Mewhoosh/tajnyprojekt.gitDB_NAME=madebyu

cd tajnyprojekt

```JWT_SECRET=zmien-to-w-produkcji

SESSION_SECRET=zmien-to-w-produkcji

Albo pobierz jako ZIP i rozpakuj.```



### 3️⃣ Zainstaluj backend### 4. (Opcjonalnie) Skonfiguruj OAuth:



```bash**Google + GitHub OAuth** - instrukcje: `docs/OAUTH_SETUP.md`

cd server

npm installJesli pominieto OAuth, logowanie przez email dziala normalnie!

```

### 5. Uruchom serwer:

**Stwórz plik `.env` w folderze `server/`** i wpisz:```bash

npm run dev

```env```

PORT=3001

DB_HOST=localhost### 6. Otworz w przegladarce:

DB_USER=root```

DB_PASSWORD=http://localhost:3000

DB_NAME=madebyu```



JWT_SECRET=twoj-bardzo-bezpieczny-sekret-klucz-jwt-12345## Struktura projektu

JWT_EXPIRES_IN=7d```

madebyu/

# OAuth (opcjonalne - można zostawić puste)├── config/              # Konfiguracja (DB, Passport, theme)

GOOGLE_CLIENT_ID=├── controllers/         # Kontrolery (Auth, Products...)

GOOGLE_CLIENT_SECRET=├── database/            # SQL schema i migracje

GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback├── docs/                # Dokumentacja

├── middleware/          # Middleware (auth, validation...)

GITHUB_CLIENT_ID=├── models/              # Modele (User, Product...)

GITHUB_CLIENT_SECRET=├── public/              # Pliki statyczne

GITHUB_CALLBACK_URL=http://localhost:3001/api/auth/github/callback│   ├── css/             # Style (variables, style, auth)

│   └── js/              # JavaScript frontendu

APP_URL=http://localhost:5173├── routes/              # Routing (auth, products...)

```├── utils/               # Narzedzia pomocnicze

├── views/               # Szablony EJS

### 4️⃣ Zainstaluj frontend└── server.js            # Glowny serwer

```

```bash

cd ../frontend## Funkcjonalnosci

npm install

```### ✅ Gotowe:

- [x] **System autentykacji**

---  - [x] Rejestracja (email + haslo)

  - [x] Logowanie (email + haslo)

## ▶️ Uruchomienie  - [x] OAuth (Google + GitHub) - gotowe do konfiguracji

  - [x] JWT tokens w HttpOnly cookies

### 1. Uruchom backend (terminal 1)  - [x] Walidacja formularzy

  - [x] Password strength indicator

```bash- [x] **Responsywny design** (beżowo-brazowa paleta)

cd server- [x] **Wyszukiwarka** produktow

node index.js- [x] **Rozwijane menu** kategorii z podkategoriami

```- [x] **System zmiennych CSS** (latwa zmiana kolorow przez admina)

- [x] **Baza danych MySQL** (11 tabel)

✅ Powinieneś zobaczyć:- [x] **Dashboard** uzytkownika

```- [x] **Role systemu** (user, moderator, admin)

✅ Database synchronized- [x] Animacje i efekty hover

✅ Categories seeded

✅ Themes seeded### 📋 W planach:

🚀 Server running on port 3001- [ ] CRUD produktow

```- [ ] Upload zdjec

- [ ] Koszyk zakupowy

### 2. Uruchom frontend (terminal 2)- [ ] System zamowien

- [ ] Platnosci (Stripe Sandbox)

```bash- [ ] Recenzje i oceny

cd frontend- [ ] Powiadomienia

npm run dev- [ ] Panel admina (zmiana kolorow, kategorie)

```- [ ] Panel moderatora

- [ ] Wishlist

✅ Powinieneś zobaczyć:- [ ] Wyszukiwarka z filtrami

```

VITE v7.2.2  ready in 260 ms## Endpointy

➜  Local:   http://localhost:5173/

```### Publiczne:

- `GET /` - Strona glowna

### 3. Otwórz przeglądarkę- `GET /products` - Lista produktow

- `GET /login` - Formularz logowania

Wejdź na: **http://localhost:5173**- `GET /register` - Formularz rejestracji



---### Autentykacja:

- `POST /auth/register` - Rejestracja

## 👤 Konto administratora- `POST /auth/login` - Logowanie

- `GET /logout` - Wylogowanie

Po pierwszym uruchomieniu automatycznie tworzy się konto admina:- `GET /auth/google` - Logowanie przez Google

- `GET /auth/github` - Logowanie przez GitHub

- **Email:** `admin@madebyu.pl`

- **Hasło:** `admin123`### Chronione (wymaga logowania):

- `GET /dashboard` - Panel uzytkownika

⚠️ **ZMIEŃ HASŁO** po pierwszym zalogowaniu!

### API:

---- `GET /css/variables.css` - Dynamiczne CSS variables (z konfigu)



## 🎨 System motywów## System kolorow



Projekt zawiera system motywów kolorystycznych - cała strona zmienia kolory na żywo!Wszystkie kolory sa zdefiniowane w `config/theme.config.js` i automatycznie

generowane jako CSS variables. Admin bedzie mogl je zmienic z panelu!

### Jak zmienić motyw jako user:

1. Zaloguj się**Dokumentacja:** `docs/COLOR_SYSTEM.md`

2. Przejdź do **Dashboard** → zakładka **"Wybór Motywu"**

3. Kliknij "Wybierz" przy ulubionym motywie## Bezpieczenstwo

4. Strona zmieni kolory natychmiast! ✨

- ✅ Hasla hashowane (bcrypt)

### Jak zarządzać motywami jako admin:- ✅ JWT w HttpOnly cookies

1. Zaloguj się jako admin (`admin@madebyu.pl`)- ✅ SQL injection prevention (prepared statements)

2. Przejdź do **Dashboard** → zakładka **"Panel Admina"**- ✅ XSS protection

3. Możesz:- ✅ CSRF protection (sesje)

   - ✏️ Tworzyć nowe motywy (wybierz 3 kolory)- ✅ Walidacja inputow (express-validator)

   - ⭐ Ustawiać domyślny motyw- ✅ Rate limiting (TODO)

   - 🗑️ Usuwać motywy

## Testowanie

### Domyślne motywy:

- 🟤 **Klasyczny Brązowy** (domyślny)### Test rejestracji:

- 🔵 **Morski Niebieski**1. http://localhost:3000/register

- 🟢 **Leśna Zieleń**2. Wypelnij formularz

3. Powinno przekierowac do /dashboard

---

### Test logowania:

## 📦 Struktura projektu1. http://localhost:3000/login

2. Zaloguj sie utworzonym kontem

```3. Dashboard powinien pokazac dane uzytkownika

madebyu/

├── server/              # Backend (Node.js + Express + Sequelize)### Test OAuth (jesli skonfigurowane):

│   ├── config/          # Konfiguracja (database, passport)1. Kliknij "Google" lub "GitHub" na /login

│   ├── models/          # Modele bazy danych (User, Product, Theme...)2. Zaloguj sie przez OAuth provider

│   ├── routes/          # API endpoints3. Powinno utworzyc konto i przekierowac do /dashboard

│   ├── index.js         # Główny plik serwera

│   └── .env             # Zmienne środowiskowe (musisz stworzyć!)## Troubleshooting

│

├── frontend/            # Frontend (React + Vite)### Blad polaczenia z baza:

│   ├── src/```

│   │   ├── components/  # Komponenty (Navbar)✗ Blad polaczenia z baza danych

│   │   ├── pages/       # Strony (Home, Login, Dashboard...)```

│   │   ├── services/    # API client**Rozwiazanie:**

│   │   └── App.jsx      # Główny komponent- Sprawdz czy MySQL dziala w XAMPP

│   └── package.json- Sprawdz .env (DB_HOST, DB_USER, DB_NAME)

│- Sprawdz czy baza `madebyu` istnieje

└── README.md            # Ten plik

```### Blad OAuth:

```

---redirect_uri_mismatch

```

## 🛠️ Technologie**Rozwiazanie:**

- Zobacz `docs/OAUTH_SETUP.md`

### Backend:- Sprawdz URL callback w Google/GitHub console

- **Node.js** - środowisko uruchomieniowe JavaScript

- **Express.js** - framework do tworzenia API### Blad JWT:

- **Sequelize** - ORM do komunikacji z bazą MySQL```

- **Passport.js** - autentykacja (JWT + OAuth)Sesja wygasla

- **bcryptjs** - bezpieczne hashowanie haseł```

**Rozwiazanie:**

### Frontend:- Sprawdz JWT_SECRET w .env

- **React 19** - biblioteka do budowania UI- Wyloguj sie i zaloguj ponownie

- **Vite** - szybki build tool

- **React Router** - nawigacja między stronami## Contribution

- **TailwindCSS** - stylowanie

Projekt w fazie rozwoju. 

### Baza danych:

- **MySQL** - relacyjna baza danych## Licencja



---MIT


## 🔧 Przydatne komendy

### Backend:
```bash
# Uruchomienie serwera
cd server
node index.js

# Instalacja nowych paczek
npm install nazwa-paczki
```

### Frontend:
```bash
# Uruchomienie dev serwera
cd frontend
npm run dev

# Build produkcyjny
npm run build

# Preview buildu
npm run preview
```

---

## ❗ Częste problemy i rozwiązania

### ❌ Backend nie może połączyć się z bazą
**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:3306`

**Rozwiązanie:**
1. Sprawdź czy MySQL w XAMPP jest uruchomiony (zielony przycisk)
2. Sprawdź plik `.env` - `DB_USER=root`, `DB_PASSWORD=` (puste!)
3. Sprawdź czy baza `madebyu` istnieje w phpMyAdmin

---

### ❌ Frontend pokazuje błędy CORS
**Problem:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Rozwiązanie:**
1. Upewnij się że backend działa na porcie **3001**
2. Sprawdź terminal backendu - powinno być `Server running on port 3001`

---

### ❌ Port już zajęty
**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

**Rozwiązanie:**

**Windows:**
```bash
# Znajdź proces na porcie 3001
netstat -ano | findstr :3001

# Zabij proces (zamień PID na numer z poprzedniej komendy)
taskkill /PID <numer> /F
```

**Lub zmień port:**
- W pliku `server/.env` zmień `PORT=3001` na `PORT=3002`
- W pliku `frontend/src/services/api.js` zmień `http://localhost:3001` na `http://localhost:3002`

---

### ❌ Motywy się nie zmieniają
**Problem:** Po kliknięciu "Wybierz" kolory nie zmieniają się

**Rozwiązanie:**
1. Odśwież stronę (`Ctrl + R` lub `F5`)
2. Wyczyść cache przeglądarki (`Ctrl + Shift + Delete`)
3. Sprawdź czy backend działa (terminal 1)

---

### ❌ `npm install` pokazuje błędy
**Problem:** Błędy podczas instalacji paczek

**Rozwiązanie:**
1. Sprawdź czy masz zainstalowany Node.js (`node --version`)
2. Usuń folder `node_modules` i plik `package-lock.json`
3. Uruchom ponownie `npm install`

---

## 📝 Dodatkowe informacje

### Automatyczne seedowanie danych:
- ✅ 4 kategorie produktów: Ceramika, Biżuteria, Drewno, Tekstylia
- ✅ 3 motywy kolorystyczne: Brązowy, Niebieski, Zielony
- ✅ Konto admina (tylko przy pierwszym uruchomieniu)

### Bezpieczeństwo:
- 🔒 Hasła są hashowane (bcrypt)
- 🔒 Tokeny JWT ważne przez 7 dni
- 🔒 Sesje w localStorage

### Role użytkowników:
- **user** - zwykły użytkownik (może przeglądać, kupować, wybierać motywy)
- **moderator** - może moderować treści
- **admin** - pełny dostęp (zarządzanie motywami, użytkownikami)

---

## 📞 Potrzebujesz pomocy?

Jeśli coś nie działa:

1. **Sprawdź logi:**
   - Terminal backendu - błędy serwera
   - Terminal frontendu - błędy Vite
   - Konsola przeglądarki (`F12`) - błędy JavaScript

2. **Sprawdź czy wszystko działa:**
   - XAMPP MySQL - zielony przycisk
   - Backend - `Server running on port 3001`
   - Frontend - `Local: http://localhost:5173/`

3. **Zrestartuj wszystko:**
   - Zatrzymaj backend (`Ctrl+C` w terminalu)
   - Zatrzymaj frontend (`Ctrl+C` w terminalu)
   - Uruchom ponownie oba

4. **Sprawdź porty:**
   - Backend: port **3001**
   - Frontend: port **5173**
   - MySQL: port **3306**

---

## 🎉 Gotowe!

Twój marketplace rękodzieła działa! Możesz:
- ✅ Przeglądać produkty
- ✅ Rejestrować się i logować
- ✅ Zmieniać motywy kolorystyczne
- ✅ Zarządzać motywami jako admin

**Miłej zabawy!** 🚀✨

---

## 📚 Wymagania Projektowe (PAI 2025/26)

Projekt spełnia wymagania przedmiotu **Projektowanie Aplikacji Internetowych** prowadzonego przez dr. Karola Pąka.

### ✅ Minimalne wymagania:
- ✅ **Responsywność** - aplikacja dostosowuje się do różnych rozmiarów ekranu
- ✅ **Web Usability** - intuicyjny interfejs, łatwa nawigacja, komfort użytkowania
- ✅ **Unikalny charakter** - wszystkie komponenty są custom, bez domyślnych szablonów
- ✅ **Dokumentacja** - README z instrukcją instalacji i uruchomienia

### 🔐 Logowanie/Rejestracja (5.0):
- ✅ **Odporność na SQL Injection** - Sequelize ORM z prepared statements
- ✅ **Zapamiętywanie pól** - React state zachowuje dane przy błędach
- ✅ **Responsywny wygląd** - dedykowany design dla desktop i mobile
- ✅ **Token-based auth** - JWT w localStorage (7 dni ważności)
- ✅ **OAuth** - logowanie przez **Google** i **GitHub** (dane użytkownika uzupełniane automatycznie)

### 🎨 Kolorystyka (Min + 2.0):
- ✅ **3 kolory bazowe** - primary, secondary, accent
- ✅ **Automatyczne wyliczanie** - pozostałe kolory (cienie, tła, teksty) wyliczane z bazowych
- ✅ **Cała aplikacja** - system zmiennych CSS w całym projekcie (navbar, hero, footer, karty, przyciski)
- ✅ **Administrator modyfikuje kolory** - panel admina z color pickerami, zapis do bazy MySQL
- ✅ **Motywy** - admin definiuje motywy (3 domyślne: Brązowy, Niebieski, Zielony)
- ✅ **Wybór motywu przez użytkownika** - każdy user może wybrać swój motyw w profilu
- ✅ **Live preview** - zmiana kolorów na żywo bez przeładowania strony

### 📝 Komentarze (Min + częściowo):
- ✅ **Role użytkowników** - admin/moderator/user (model User z enum)
- ✅ **Kategorie** - produkty przypisane do kategorii (4 domyślne: Ceramika, Biżuteria, Drewno, Tekstylia)
- ✅ **Struktura bazy** - modele: User, Category, Product, ProductImage, Order, OrderItem, Theme, UserTheme
- ⏳ **System komentarzy** - w przygotowaniu (modele gotowe, UI do zrobienia)
- ⏳ **Moderacja postów** - w przygotowaniu
- ⏳ **Powiadomienia** - w przygotowaniu

### 🛒 Koszyk (częściowo):
- ✅ **Struktura bazy** - modele Order, OrderItem gotowe z relacjami
- ✅ **Pola zamówienia** - total_amount, shipping_address, payment status, order status
- ⏳ **UI koszyka** - w przygotowaniu
- ⏳ **Płatności sandbox** - w przygotowaniu

### 🖼️ Galeria (częściowo):
- ✅ **Model ProductImage** - wiele zdjęć na produkt z flagą is_primary
- ✅ **Struktura bazy** - relacje Product → ProductImage (hasMany)
- ⏳ **Upload zdjęć** - w przygotowaniu
- ⏳ **Slider** - w przygotowaniu

### 🔧 Dodatkowe funkcjonalności:
- ✅ **Sequelize ORM** - automatyczna synchronizacja bazy, migracje
- ✅ **Seed data** - automatyczne tworzenie kategorii, motywów, admina
- ✅ **Middleware auth** - ochrona endpointów, sprawdzanie ról
- ✅ **API REST** - kompletne API dla auth, themes, products, categories
- ✅ **React Router** - SPA z routingiem
- ✅ **Centralized API service** - dedykowany serwis do komunikacji frontend-backend

### 📊 Podsumowanie punktów:

| Element | Punkty | Status |
|---------|--------|--------|
| Logowanie/Rejestracja | 5.0 | ✅ Gotowe |
| Kolorystyka (min + admin + motywy) | Min + 2.0 | ✅ Gotowe |
| Komentarze (struktura) | Min (częściowo) | 🟡 W trakcie |
| Koszyk (struktura) | Częściowo | 🟡 W trakcie |
| Galeria (struktura) | Częściowo | 🟡 W trakcie |

**Łączny postęp:** ~60% (core functionality gotowa, UI features w trakcie)

---
