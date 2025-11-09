// CONFIG - Ustawienia motywu (pozniej z bazy danych)
// Ten plik bedzie dynamicznie generowany przez panel admina

const themeConfig = {
    // Kolory motywu
    colors: {
        primary: '#8b6f47',
        secondary: '#a0826d',
        accent: '#c9a882',
        dark: '#5d4e37',
        text: '#3e3530',
        textLight: '#8b7d6b',
        bgCream: '#f5ebe0',
        bgLight: '#faf7f2',
        border: '#dfd3c3',
        success: '#7d8f69',
        danger: '#c97064'
    },
    
    // Typografia
    fonts: {
        heading: 'Playfair Display, serif',
        body: 'Inter, sans-serif'
    },
    
    // Spacing
    spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem'
    },
    
    // Border radius
    radius: {
        sm: '8px',
        md: '12px',
        lg: '25px',
        full: '30px'
    },
    
    // Nazwa sklepu
    siteName: 'MadeByU',
    
    // Kategorie (pozniej z bazy danych)
    categories: [
        {
            id: 1,
            name: 'Ceramika',
            slug: 'ceramika',
            subcategories: [
                { id: 11, name: 'Naczynia', slug: 'naczynia' },
                { id: 12, name: 'Wazony', slug: 'wazony' },
                { id: 13, name: 'Figurki', slug: 'figurki' }
            ]
        },
        {
            id: 2,
            name: 'Bizuteria',
            slug: 'bizuteria',
            subcategories: [
                { id: 21, name: 'Naszyjniki', slug: 'naszyjniki' },
                { id: 22, name: 'Bransoletki', slug: 'bransoletki' },
                { id: 23, name: 'Kolczyki', slug: 'kolczyki' }
            ]
        },
        {
            id: 3,
            name: 'Drewno',
            slug: 'drewno',
            subcategories: [
                { id: 31, name: 'Deski do krojenia', slug: 'deski' },
                { id: 32, name: 'Skrzynki', slug: 'skrzynki' },
                { id: 33, name: 'Dekoracje', slug: 'dekoracje' }
            ]
        },
        {
            id: 4,
            name: 'Tekstylia',
            slug: 'tekstylia',
            subcategories: [
                { id: 41, name: 'Szale', slug: 'szale' },
                { id: 42, name: 'Torby', slug: 'torby' },
                { id: 43, name: 'Poduszki', slug: 'poduszki' }
            ]
        }
    ]
};

// Export dla Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = themeConfig;
}

// Dostepne globalnie w przegladarce
if (typeof window !== 'undefined') {
    window.themeConfig = themeConfig;
}
