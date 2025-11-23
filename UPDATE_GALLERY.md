# Instrukcja aktualizacji bazy danych

## 1. Dodaj tabele gallery

Otwórz phpMyAdmin i uruchom plik:
`database/gallery_table.sql`

Lub skopiuj i wykonaj SQL:

```sql
USE madebyu;

CREATE TABLE IF NOT EXISTS gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INT NULL,
    height INT NULL,
    alt_text VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2. Folder uploads już utworzony

Folder `uploads/gallery/` został już utworzony automatycznie.

## 3. Uruchom serwer

Backend i frontend działają normalnie. Nowe endpointy:

- GET /api/gallery - pobierz galerie użytkownika
- POST /api/gallery/upload - upload pojedynczego zdjęcia
- POST /api/gallery/upload-multiple - upload wielu zdjęć
- DELETE /api/gallery/:id - usuń zdjęcie
- PUT /api/gallery/:id - aktualizuj alt text

## Co się zmieniło:

### 1. CategoryTree (drzewko kategorii)
- Kategorie rozwijają się po najechaniu myszką
- Ładny design zgodny z motywem
- Pokazuje wybraną kategorię z wyraźną ikoną ✓

### 2. ImageGalleryPicker (galeria zdjęć)
- Upload zdjęć do serwera (max 5MB, formaty: JPG, PNG, GIF, WebP)
- Wybór zdjęć z galerii przez kliknięcie
- Zmiana kolejności strzałkami ← →
- Pierwsze zdjęcie = zdjęcie główne
- Wszystko stylowane z użyciem CSS variables dla motywu

### 3. AddProduct (formularz)
- Zamiast select - piękne drzewko kategorii
- Zamiast URL inputs - galeria z uploadem
- Walidacja: musi być kategoria i min. 1 zdjęcie
