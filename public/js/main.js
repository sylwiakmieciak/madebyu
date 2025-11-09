// Glowny plik JavaScript

document.addEventListener('DOMContentLoaded', function() {
    console.log('MadeByU - Aplikacja zaladowana!');
    
    initFilters();
    initSearch();
    initDropdownMenu();
});

// Inicjalizacja wyszukiwarki
function initSearch() {
    const searchInput = document.querySelector('.search-input');
    const searchForm = document.querySelector('.search-form');
    
    if (searchInput) {
        // Podswietlenie przy focus
        searchInput.addEventListener('focus', function() {
            this.parentElement.classList.add('search-active');
        });
        
        searchInput.addEventListener('blur', function() {
            this.parentElement.classList.remove('search-active');
        });
        
        // Obsługa wysylania formularza
        if (searchForm) {
            searchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const query = searchInput.value.trim();
                
                if (query) {
                    console.log('Wyszukiwanie:', query);
                    // Tutaj pozniej bedzie przekierowanie do wynikow
                    alert('Wyszukiwanie: ' + query + '\n(Funkcja bedzie dodana z backendem)');
                }
            });
        }
    }
}

// Inicjalizacja rozwijalnego menu
function initDropdownMenu() {
    const dropdown = document.querySelector('.nav-dropdown');
    
    if (dropdown) {
        // Dla mobilnych - klikniecie otwiera/zamyka menu
        const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
        
        if (dropdownToggle && window.innerWidth <= 768) {
            dropdownToggle.addEventListener('click', function(e) {
                e.preventDefault();
                dropdown.classList.toggle('dropdown-active');
            });
            
            // Zamykanie przy kliknieciu poza menu
            document.addEventListener('click', function(e) {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('dropdown-active');
                }
            });
        }
    }
}

// Inicjalizacja filtrow
function initFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            console.log('Zmieniono kategorie:', this.value);
            // Tutaj pozniej filtrowanie produktow
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            console.log('Zmieniono sortowanie:', this.value);
            // Tutaj pozniej sortowanie produktow
        });
    }
}

// Funkcja dodawania do koszyka (na razie tylko log)
function addToCart(productId) {
    console.log('Dodano do koszyka produkt:', productId);
    alert('Produkt dodany do koszyka!');
}
