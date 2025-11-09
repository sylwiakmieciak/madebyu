# DOKUMENTACJA - SYSTEM ZMIAN KOLOROW PRZEZ ADMINA

## Jak dziala system zmiennych CSS?

Wszystkie kolory aplikacji sa zdefiniowane w pliku: `public/css/variables.css`

### Struktura zmiennych:

```css
:root {
    /* Te zmienne mozna edytowac z panelu admina */
    --theme-primary: #8b6f47;        /* Glowny kolor marki */
    --theme-secondary: #a0826d;      /* Kolor dodatkowy */
    --theme-accent: #c9a882;         /* Kolor akcentu */
    --theme-dark: #5d4e37;           /* Ciemny odcien */
    --theme-text: #3e3530;           /* Kolor tekstu */
    --theme-text-light: #8b7d6b;    /* Jasny tekst */
    --theme-bg-cream: #f5ebe0;       /* Tlo kremowe */
    --theme-bg-light: #faf7f2;       /* Tlo jasne */
    --theme-border: #dfd3c3;         /* Kolory ramek */
    --theme-success: #7d8f69;        /* Kolor sukcesu */
    --theme-danger: #c97064;         /* Kolor bledu */
}
```

## Plan implementacji dla panelu admina:

### 1. Backend endpoint (do zrobienia):
```javascript
POST /admin/settings/colors
Body: {
  "theme-primary": "#8b6f47",
  "theme-secondary": "#a0826d",
  ...
}
```

### 2. Zapisywanie w bazie danych:
```sql
CREATE TABLE theme_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    variable_name VARCHAR(50),
    variable_value VARCHAR(50),
    updated_at TIMESTAMP
);
```

### 3. Generowanie dynamicznego CSS:
Backend bedzie generowal plik `variables.css` na podstawie ustawien z bazy:

```javascript
// Przyklad - server.js
app.get('/css/variables.css', async (req, res) => {
    const settings = await getThemeSettings(); // z bazy
    
    let css = ':root {\n';
    settings.forEach(setting => {
        css += `    --${setting.variable_name}: ${setting.variable_value};\n`;
    });
    css += '}\n';
    
    res.setHeader('Content-Type', 'text/css');
    res.send(css);
});
```

### 4. Panel admina - formularz:
Stworzymy interfejs z color pickerami dla kazdej zmiennej:

```html
<form action="/admin/settings/colors" method="POST">
    <div class="color-setting">
        <label>Kolor glowny</label>
        <input type="color" name="theme-primary" value="#8b6f47">
        <input type="text" name="theme-primary-hex" value="#8b6f47">
    </div>
    <!-- ... reszta pol -->
    <button type="submit">Zapisz zmiany</button>
</form>
```

### 5. Podglad na zywo:
JavaScript do podgladu zmian przed zapisaniem:

```javascript
function previewColor(variable, value) {
    document.documentElement.style.setProperty(`--${variable}`, value);
}
```

## Zmienne uzywane w komponenty:

### Nawigacja:
- `--theme-bg-cream` - tlo nawigacji
- `--theme-border` - obramowanie
- `--theme-primary` - kolor hover linkow
- `--theme-dark` - kolor logo

### Przyciski:
- `--theme-primary` + `--theme-dark` - gradient przyciskow
- `--theme-accent` - hover state

### Produkty:
- `--theme-primary` - cena produktu
- `--theme-accent` - badge
- `--theme-shadow-soft` - cienie

### Hero:
- `--theme-gradient-hero` - tlo hero section

## Zalecenia:

1. **Kontrast**: Upewnij sie, ze kolory tekstu maja dobry kontrast z tlem
2. **Spójnosc**: Zachowaj relacje miedzy kolorami (jasny/ciemny)
3. **Testowanie**: Po zmianie kolorow przetestuj wszystkie strony
4. **Backup**: Zawsze zapisuj poprzednia palety przed zmiana

## Testy:
Po implementacji backendowego edytora kolorow, przetestowac:
- [ ] Zapisywanie ustawien
- [ ] Ladowanie ustawien przy starcie
- [ ] Cache'owanie CSS
- [ ] Przywracanie domyslnych kolorow
- [ ] Eksport/import palet kolorow
