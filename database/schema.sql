-- BAZA DANYCH MADEBYU
-- Uruchom ten plik w phpMyAdmin lub MySQL CLI

CREATE DATABASE IF NOT EXISTS madebyu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE madebyu;

-- Tabela uzytkownikow
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NULL, -- NULL dla OAuth users
    username VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    bio TEXT,
    
    -- OAuth
    google_id VARCHAR(255) UNIQUE NULL,
    github_id VARCHAR(255) UNIQUE NULL,
    oauth_provider ENUM('local', 'google', 'github') DEFAULT 'local',
    
    -- Role systemu
    role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
    
    -- Weryfikacja email
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255) NULL,
    
    -- Reset hasla
    reset_password_token VARCHAR(255) NULL,
    reset_password_expires DATETIME NULL,
    
    -- Status konta
    is_active BOOLEAN DEFAULT TRUE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT NULL,
    
    -- Daty
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_google_id (google_id),
    INDEX idx_github_id (github_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela sesji
CREATE TABLE sessions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela kategorii
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT NULL,
    icon VARCHAR(100),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_parent (parent_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Przykladowe kategorie
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
('Ceramika', 'ceramika', NULL, 1),
('Bizuteria', 'bizuteria', NULL, 2),
('Drewno', 'drewno', NULL, 3),
('Tekstylia', 'tekstylia', NULL, 4);

-- Podkategorie Ceramiki
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
('Naczynia', 'naczynia', 1, 1),
('Wazony', 'wazony', 1, 2),
('Figurki', 'figurki', 1, 3);

-- Podkategorie Bizuterii
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
('Naszyjniki', 'naszyjniki', 2, 1),
('Bransoletki', 'bransoletki', 2, 2),
('Kolczyki', 'kolczyki', 2, 3);

-- Podkategorie Drewna
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
('Deski do krojenia', 'deski', 3, 1),
('Skrzynki', 'skrzynki', 3, 2),
('Dekoracje', 'dekoracje', 3, 3);

-- Podkategorie Tekstyliow
INSERT INTO categories (name, slug, parent_id, display_order) VALUES
('Szale', 'szale', 4, 1),
('Torby', 'torby', 4, 2),
('Poduszki', 'poduszki', 4, 3);

-- Tabela produktow
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    
    -- Status
    status ENUM('draft', 'published', 'sold', 'archived') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    featured_at TIMESTAMP NULL,
    
    -- Statystyki
    views_count INT DEFAULT 0,
    favorites_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_user (user_id),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_featured (is_featured)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela zdjec produktow
CREATE TABLE product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela ustawien motywu (dla admina)
CREATE TABLE theme_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    variable_name VARCHAR(50) UNIQUE NOT NULL,
    variable_value VARCHAR(50) NOT NULL,
    variable_group VARCHAR(50) DEFAULT 'colors',
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Domyslne kolory
INSERT INTO theme_settings (variable_name, variable_value, variable_group) VALUES
('theme-primary', '#8b6f47', 'colors'),
('theme-secondary', '#a0826d', 'colors'),
('theme-accent', '#c9a882', 'colors'),
('theme-dark', '#5d4e37', 'colors'),
('theme-text', '#3e3530', 'colors'),
('theme-text-light', '#8b7d6b', 'colors'),
('theme-bg-cream', '#f5ebe0', 'colors'),
('theme-bg-light', '#faf7f2', 'colors'),
('theme-border', '#dfd3c3', 'colors'),
('theme-success', '#7d8f69', 'colors'),
('theme-danger', '#c97064', 'colors');

-- Tabela wishlist (ulubione)
CREATE TABLE wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_wishlist (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela zamowien
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    buyer_id INT NOT NULL,
    
    -- Dane wysylki
    shipping_name VARCHAR(255) NOT NULL,
    shipping_email VARCHAR(255) NOT NULL,
    shipping_phone VARCHAR(50),
    shipping_address TEXT NOT NULL,
    shipping_city VARCHAR(100) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(100) DEFAULT 'Polska',
    
    -- Platnosc
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_id VARCHAR(255),
    
    -- Status zamowienia
    status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    INDEX idx_buyer (buyer_id),
    INDEX idx_status (status),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela pozycji zamowienia
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    seller_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (seller_id) REFERENCES users(id),
    INDEX idx_order (order_id),
    INDEX idx_seller (seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela recenzji
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    -- Moderacja
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    moderated_by INT NULL,
    moderated_at TIMESTAMP NULL,
    
    -- Pomocnosc
    helpful_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    FOREIGN KEY (moderated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_product (product_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela powiadomien
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Widok: produkty z kategoriami i uzytkownikami
CREATE VIEW products_view AS
SELECT 
    p.*,
    u.username as seller_username,
    u.avatar_url as seller_avatar,
    c.name as category_name,
    c.slug as category_slug,
    (SELECT image_url FROM product_images WHERE product_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
FROM products p
JOIN users u ON p.user_id = u.id
JOIN categories c ON p.category_id = c.id;

-- Przykładowy admin (haslo: admin123)
-- Haslo zostanie zahashowane przez bcrypt w aplikacji
INSERT INTO users (email, username, full_name, role, email_verified) VALUES
('admin@madebyu.pl', 'admin', 'Administrator', 'admin', TRUE);
