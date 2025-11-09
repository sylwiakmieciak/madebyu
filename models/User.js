// Model uzytkownika

const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    // Znajdz uzytkownika po ID
    static async findById(id) {
        const sql = 'SELECT * FROM users WHERE id = ?';
        const results = await query(sql, [id]);
        return results[0] || null;
    }

    // Znajdz uzytkownika po emailu
    static async findByEmail(email) {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const results = await query(sql, [email]);
        return results[0] || null;
    }

    // Znajdz uzytkownika po username
    static async findByUsername(username) {
        const sql = 'SELECT * FROM users WHERE username = ?';
        const results = await query(sql, [username]);
        return results[0] || null;
    }

    // Znajdz uzytkownika po OAuth ID
    static async findByOAuthId(provider, oauthId) {
        let sql;
        if (provider === 'google') {
            sql = 'SELECT * FROM users WHERE google_id = ?';
        } else if (provider === 'github') {
            sql = 'SELECT * FROM users WHERE github_id = ?';
        } else {
            return null;
        }
        const results = await query(sql, [oauthId]);
        return results[0] || null;
    }

    // Utworz nowego uzytkownika (rejestracja lokalna)
    static async create(userData) {
        const { email, password, username, oauthProvider, oauthId, avatarUrl } = userData;
        
        // Jesli to konto lokalne - hashuj haslo
        let hashedPassword = null;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        }
        
        let sql, params;
        
        if (oauthProvider === 'google') {
            sql = `
                INSERT INTO users (email, password, username, oauth_provider, google_id, avatar_url, email_verified)
                VALUES (?, ?, ?, 'google', ?, ?, 1)
            `;
            params = [email, hashedPassword, username, oauthId, avatarUrl];
        } else if (oauthProvider === 'github') {
            sql = `
                INSERT INTO users (email, password, username, oauth_provider, github_id, avatar_url, email_verified)
                VALUES (?, ?, ?, 'github', ?, ?, 1)
            `;
            params = [email, hashedPassword, username, oauthId, avatarUrl];
        } else {
            // Konto lokalne
            sql = `
                INSERT INTO users (email, password, username, oauth_provider, email_verified)
                VALUES (?, ?, ?, 'local', 0)
            `;
            params = [email, hashedPassword, username];
        }
        
        const result = await query(sql, params);
        
        // Zwroc caly obiekt usera
        return await User.findById(result.insertId);
    }

    // Sprawdz haslo
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    // Aktualizuj last_login
    static async updateLastLogin(userId) {
        const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
        await query(sql, [userId]);
    }
}

module.exports = User;
