# Test Guide - Nowe Komponenty

## Jak przetestować:

### 1. Uruchom bazę danych
1. Otwórz phpMyAdmin
2. Uruchom SQL z pliku `database/gallery_table.sql`

### 2. Uruchom backend i frontend

```powershell
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 3. Testuj nowe funkcje

#### A. Upload zdjęć do galerii
1. Zaloguj się na swoje konto
2. Idź do "Dodaj produkt" (`/add-product`)
3. W sekcji "Zdjecia produktu":
   - Kliknij "+ Upload nowe"
   - Wybierz zdjęcia (max 5MB, JPG/PNG/GIF/WebP)
   - Czekaj na upload
   - Zdjęcia pojawią się w galerii poniżej

#### B. Wybór kategorii z drzewka
1. W sekcji "Kategoria":
   - Najedź myszką na kategorię główną (np. "Ceramika")
   - Podkategorie rozwija się automatycznie
   - Kliknij na podkategorię (np. "Naczynia")
   - Zobacz zielony badge "Wybrano: Naczynia"

#### C. Wybór zdjęć z galerii
1. W sekcji "Zdjecia produktu":
   - Kliknij na zdjęcie w galerii aby je wybrać
   - Pojawi się nad galerią w sekcji "Wybrane zdjecia"
   - Pierwsze zdjęcie ma badge "Glowne"
   - Użyj strzałek ← → aby zmienić kolejność
   - Kliknij ✕ aby usunąć zdjęcie
   - Max 5 zdjęć

#### D. Dodaj produkt
1. Wypełnij formularz:
   - Tytuł
   - Kategoria (z drzewka)
   - Opis
   - Cena
   - Ilość sztuk
   - Min. 1 zdjęcie z galerii
2. Kliknij "Dodaj produkt"
3. Zostaniesz przeniesiony do Dashboard

## Co sprawdzić:

### Styling zgodny z motywem
- [ ] Kolory używają CSS variables (--primary-color, --accent-color)
- [ ] Hover effects działają płynnie
- [ ] Border colors zmieniają się z motywem
- [ ] Przyciski używają kolorów motywu

### CategoryTree
- [ ] Kategorie rozwijają się po najechaniu
- [ ] Wybrana kategoria ma zielony background
- [ ] Badge "✓" pojawia się przy wybranej kategorii
- [ ] Scrollbar jest wystylowany

### ImageGalleryPicker
- [ ] Upload działa (pojedyncze i multiple)
- [ ] Wybrane zdjęcia mają overlay z ✓
- [ ] Kolejność można zmieniać strzałkami
- [ ] Pierwsze zdjęcie ma badge "Glowne"
- [ ] Usuwanie zdjęć działa
- [ ] Max 5 zdjęć enforcement

### Walidacja
- [ ] Nie można dodać produktu bez kategorii
- [ ] Nie można dodać produktu bez zdjęcia
- [ ] Pokazuje błędy walidacji

## Troubleshooting

### Upload nie działa
- Sprawdź czy folder `uploads/gallery/` istnieje
- Sprawdź rozmiar pliku (max 5MB)
- Sprawdź format (tylko JPG, PNG, GIF, WebP)

### Zdjęcia nie ładują się
- Sprawdź czy backend serwuje static files: `app.use('/uploads', ...)`
- Sprawdź w Network tab czy request do `/uploads/gallery/...` zwraca 200

### Drzewko kategorii puste
- Sprawdź czy endpoint `/api/categories` zwraca `{tree: [...], flat: [...]}`
- Sprawdź console w DevTools

### Styling nie działa
- Sprawdź czy pliki CSS są zaimportowane:
  - `CategoryTree.css` w `CategoryTree.jsx`
  - `ImageGalleryPicker.css` w `ImageGalleryPicker.jsx`
