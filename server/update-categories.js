const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'madebyu',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const categories = [
  // Główne kategorie (Level 1) - 15 kategorii
  { id: 1, name: 'Ceramika', parent_id: null },
  { id: 2, name: 'Biżuteria', parent_id: null },
  { id: 3, name: 'Drewno', parent_id: null },
  { id: 4, name: 'Tekstylia', parent_id: null },
  { id: 5, name: 'Szkło', parent_id: null },
  { id: 6, name: 'Metal', parent_id: null },
  { id: 7, name: 'Papier', parent_id: null },
  { id: 8, name: 'Skóra', parent_id: null },
  { id: 9, name: 'Świece', parent_id: null },
  { id: 10, name: 'Mydła', parent_id: null },
  { id: 11, name: 'Malarstwo', parent_id: null },
  { id: 12, name: 'Hafty', parent_id: null },
  { id: 13, name: 'Makrama', parent_id: null },
  { id: 14, name: 'Żywica', parent_id: null },
  { id: 15, name: 'Kwiaty suszone', parent_id: null },

  // Ceramika (Level 2)
  { id: 101, name: 'Naczynia', parent_id: 1 },
  { id: 102, name: 'Wazony', parent_id: 1 },
  { id: 103, name: 'Figurki', parent_id: 1 },
  { id: 104, name: 'Kafle', parent_id: 1 },

  // Ceramika -> Naczynia (Level 3)
  { id: 1011, name: 'Miski', parent_id: 101 },
  { id: 1012, name: 'Kubki', parent_id: 101 },
  { id: 1013, name: 'Talerze', parent_id: 101 },
  { id: 1014, name: 'Dzbanki', parent_id: 101 },

  // Ceramika -> Wazony (Level 3)
  { id: 1021, name: 'Wazony dekoracyjne', parent_id: 102 },
  { id: 1022, name: 'Wazony na kwiaty', parent_id: 102 },

  // Biżuteria (Level 2)
  { id: 201, name: 'Naszyjniki', parent_id: 2 },
  { id: 202, name: 'Bransoletki', parent_id: 2 },
  { id: 203, name: 'Kolczyki', parent_id: 2 },
  { id: 204, name: 'Pierścionki', parent_id: 2 },
  { id: 205, name: 'Broszki', parent_id: 2 },

  // Biżuteria -> Naszyjniki (Level 3)
  { id: 2011, name: 'Krótkie naszyjniki', parent_id: 201 },
  { id: 2012, name: 'Długie naszyjniki', parent_id: 201 },
  { id: 2013, name: 'Wisiorki', parent_id: 201 },

  // Biżuteria -> Bransoletki (Level 3)
  { id: 2021, name: 'Bransoletki srebrne', parent_id: 202 },
  { id: 2022, name: 'Bransoletki koralikowe', parent_id: 202 },

  // Drewno (Level 2)
  { id: 301, name: 'Deski do krojenia', parent_id: 3 },
  { id: 302, name: 'Skrzynki', parent_id: 3 },
  { id: 303, name: 'Dekoracje', parent_id: 3 },
  { id: 304, name: 'Meble', parent_id: 3 },
  { id: 305, name: 'Zabawki', parent_id: 3 },

  // Drewno -> Deski (Level 3)
  { id: 3011, name: 'Deski małe', parent_id: 301 },
  { id: 3012, name: 'Deski duże', parent_id: 301 },
  { id: 3013, name: 'Deski grawerowane', parent_id: 301 },

  // Drewno -> Dekoracje (Level 3)
  { id: 3031, name: 'Tabliczki', parent_id: 303 },
  { id: 3032, name: 'Ozdoby świąteczne', parent_id: 303 },

  // Tekstylia (Level 2)
  { id: 401, name: 'Szale', parent_id: 4 },
  { id: 402, name: 'Torby', parent_id: 4 },
  { id: 403, name: 'Poduszki', parent_id: 4 },
  { id: 404, name: 'Dywany', parent_id: 4 },
  { id: 405, name: 'Narzuty', parent_id: 4 },

  // Tekstylia -> Torby (Level 3)
  { id: 4021, name: 'Torby na zakupy', parent_id: 402 },
  { id: 4022, name: 'Torebki damskie', parent_id: 402 },
  { id: 4023, name: 'Plecaki', parent_id: 402 },

  // Szkło (Level 2)
  { id: 501, name: 'Szklanki', parent_id: 5 },
  { id: 502, name: 'Witraże', parent_id: 5 },
  { id: 503, name: 'Bombki', parent_id: 5 },
  { id: 504, name: 'Lampiony', parent_id: 5 },

  // Szkło -> Witraże (Level 3)
  { id: 5021, name: 'Witraże okienne', parent_id: 502 },
  { id: 5022, name: 'Lampki witrażowe', parent_id: 502 },
  { id: 5023, name: 'Łapacze snów', parent_id: 502 },

  // Metal (Level 2)
  { id: 601, name: 'Rzeźby', parent_id: 6 },
  { id: 602, name: 'Lampy', parent_id: 6 },
  { id: 603, name: 'Świeczniki', parent_id: 6 },
  { id: 604, name: 'Wieszaki', parent_id: 6 },

  // Metal -> Rzeźby (Level 3)
  { id: 6011, name: 'Rzeźby małe', parent_id: 601 },
  { id: 6012, name: 'Rzeźby duże', parent_id: 601 },

  // Papier (Level 2)
  { id: 701, name: 'Kartki', parent_id: 7 },
  { id: 702, name: 'Notesy', parent_id: 7 },
  { id: 703, name: 'Kalendarze', parent_id: 7 },
  { id: 704, name: 'Albumy', parent_id: 7 },

  // Papier -> Kartki (Level 3)
  { id: 7011, name: 'Kartki urodzinowe', parent_id: 701 },
  { id: 7012, name: 'Kartki świąteczne', parent_id: 701 },
  { id: 7013, name: 'Zaproszenia', parent_id: 701 },

  // Skóra (Level 2)
  { id: 801, name: 'Portfele', parent_id: 8 },
  { id: 802, name: 'Paski', parent_id: 8 },
  { id: 803, name: 'Etui', parent_id: 8 },
  { id: 804, name: 'Bransoletki skórzane', parent_id: 8 },

  // Świece (Level 2)
  { id: 901, name: 'Świece zapachowe', parent_id: 9 },
  { id: 902, name: 'Świece sojowe', parent_id: 9 },
  { id: 903, name: 'Świece dekoracyjne', parent_id: 9 },

  // Mydła (Level 2)
  { id: 1001, name: 'Mydła naturalne', parent_id: 10 },
  { id: 1002, name: 'Mydła glicerynowe', parent_id: 10 },
  { id: 1003, name: 'Mydła zapachowe', parent_id: 10 },

  // Malarstwo (Level 2)
  { id: 1101, name: 'Obrazy olejne', parent_id: 11 },
  { id: 1102, name: 'Obrazy akrylowe', parent_id: 11 },
  { id: 1103, name: 'Akwarele', parent_id: 11 },
  { id: 1104, name: 'Grafiki', parent_id: 11 },

  // Hafty (Level 2)
  { id: 1201, name: 'Obrazy haftowane', parent_id: 12 },
  { id: 1202, name: 'Poduszki haftowane', parent_id: 12 },
  { id: 1203, name: 'Obrusy haftowane', parent_id: 12 },

  // Makrama (Level 2)
  { id: 1301, name: 'Dekoracje ścienne', parent_id: 13 },
  { id: 1302, name: 'Donice makrama', parent_id: 13 },
  { id: 1303, name: 'Zasłony makrama', parent_id: 13 },

  // Żywica (Level 2)
  { id: 1401, name: 'Biżuteria z żywicy', parent_id: 14 },
  { id: 1402, name: 'Podkładki z żywicy', parent_id: 14 },
  { id: 1403, name: 'Figurki z żywicy', parent_id: 14 },
  { id: 1404, name: 'Tacki z żywicy', parent_id: 14 },

  // Kwiaty suszone (Level 2)
  { id: 1501, name: 'Bukiety suszone', parent_id: 15 },
  { id: 1502, name: 'Wianki', parent_id: 15 },
  { id: 1503, name: 'Kompozycje w ramach', parent_id: 15 },
  { id: 1504, name: 'Dekoracje z kwiatów', parent_id: 15 }
];

async function updateCategories() {
  try {
    console.log('Łączenie z bazą danych...');
    
    // NIE usuwamy produktów - tylko aktualizujemy kategorie
    console.log('Aktualizacja kategorii (bez usuwania produktów)...');
    
    // Usuń stare kategorie tylko jeśli nie ma produktów
    const [productCount] = await pool.query('SELECT COUNT(*) as count FROM products');
    if (productCount[0].count > 0) {
      console.log(`⚠️  W bazie jest ${productCount[0].count} produktów - NIE usuwam kategorii!`);
      console.log('Aby zaktualizować kategorie, najpierw usuń produkty ręcznie lub użyj INSERT ON DUPLICATE KEY UPDATE');
      process.exit(1);
    }
    
    // Usuń stare kategorie
    console.log('Usuwanie starych kategorii...');
    await pool.query('DELETE FROM categories');
    console.log('Stare kategorie usunięte');
    
    // Dodaj nowe kategorie
    console.log('Dodawanie nowych kategorii...');
    for (const category of categories) {
      const slug = category.name.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
        .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      await pool.query(
        'INSERT INTO categories (id, name, slug, parent_id) VALUES (?, ?, ?, ?)',
        [category.id, category.name, slug, category.parent_id]
      );
    }
    
    console.log(`Dodano ${categories.length} kategorii!`);
    console.log('Struktura kategorii:');
    console.log('- 15 głównych kategorii');
    console.log('- Ponad 50 podkategorii (poziom 2 i 3)');
    console.log('Główne kategorie: Ceramika, Biżuteria, Drewno, Tekstylia, Szkło, Metal, Papier, Skóra, Świece, Mydła, Malarstwo, Hafty, Makrama, Żywica, Kwiaty suszone');
    
    process.exit(0);
  } catch (error) {
    console.error('Błąd:', error);
    process.exit(1);
  }
}

updateCategories();
