# INSTRUKCJA - Import bazy danych

## Sposob 1: phpMyAdmin (ZALECANY)

1. **Otworz XAMPP Control Panel**
   - Uruchom Apache
   - Uruchom MySQL

2. **Otworz phpMyAdmin**
   - Przegladarka: http://localhost/phpmyadmin

3. **Wybierz baze `madebyu`**
   - Kliknij na `madebyu` w lewym menu

4. **Import SQL**
   - Kliknij zakladke "Import" u gory
   - Kliknij "Wybierz plik" (Choose File)
   - Wybierz: `d:\madebyu\database\schema.sql`
   - Kliknij "Wykonaj" (Go) na dole

5. **Sprawdz czy zadzialo**
   - Powinienes zobaczyc zielony komunikat
   - W lewym menu baza `madebyu` powinna miec 11 tabel

## Sposob 2: MySQL CLI

```bash
# W terminalu
cd D:\xampp\mysql\bin
.\mysql.exe -u root madebyu < D:\madebyu\database\schema.sql
```

## Co zostanie utworzone?

### Tabele:
- `users` - Uzytkownicy (z OAuth)
- `sessions` - Sesje
- `categories` - Kategorie produktow (+ 12 przykladowych)
- `products` - Produkty
- `product_images` - Zdjecia produktow
- `orders` - Zamowienia
- `order_items` - Pozycje zamowien
- `reviews` - Recenzje
- `wishlist` - Ulubione
- `notifications` - Powiadomienia
- `theme_settings` - Ustawienia kolorow (dla admina)

### Przykladowe dane:
- 4 kategorie glowne (Ceramika, Bizuteria, Drewno, Tekstylia)
- 12 podkategorii
- Domyslne kolory motywu
- 1 konto admina (email: admin@madebyu.pl, trzeba ustawic haslo)

## Po imporcie:

1. Ustaw haslo dla admina:
```sql
-- W phpMyAdmin -> SQL
UPDATE users 
SET password = '$2a$10$YourHashedPasswordHere' 
WHERE email = 'admin@madebyu.pl';
```

Lub zarejestruj nowe konto przez aplikacje i zmien role:
```sql
UPDATE users SET role = 'admin' WHERE email = 'twoj@email.com';
```

2. Sprawdz polaczenie:
- Uruchom aplikacje: `npm run dev`
- Powinno byc: "✓ Polaczono z baza danych MySQL"

## Troubleshooting:

### Blad: "Table already exists"
```sql
DROP DATABASE madebyu;
CREATE DATABASE madebyu;
-- Potem import ponownie
```

### Blad polaczenia z aplikacji:
- Sprawdz `.env`:
  ```
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=madebyu
  ```
- Upewnij sie ze MySQL dziala w XAMPP
