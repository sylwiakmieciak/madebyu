// HELPER - Generowanie CSS z konfiguracji
// Bedzie uzywany przez endpoint /css/variables.css

const themeConfig = require('../config/theme.config');

/**
 * Generuje CSS variables na podstawie konfiguracji
 * @param {Object} config - Obiekt konfiguracji motywu
 * @returns {String} - CSS ze zmiennymi
 */
function generateCSSVariables(config = themeConfig) {
    const { colors, fonts, spacing, radius } = config;
    
    let css = '/* Automatycznie wygenerowane zmienne CSS */\n';
    css += '/* Ostatnia aktualizacja: ' + new Date().toISOString() + ' */\n\n';
    css += ':root {\n';
    
    // Kolory
    css += '    /* Kolory motywu - EDYTOWALNE PRZEZ ADMINA */\n';
    Object.keys(colors).forEach(key => {
        const varName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        css += `    --theme-${varName}: ${colors[key]};\n`;
    });
    
    css += '\n    /* Cienie - dynamiczne */\n';
    css += '    --theme-shadow-soft: rgba(93, 78, 55, 0.08);\n';
    css += '    --theme-shadow-medium: rgba(93, 78, 55, 0.15);\n';
    css += '    --theme-shadow-strong: rgba(93, 78, 55, 0.25);\n';
    
    css += '\n    /* Gradienty */\n';
    css += `    --theme-gradient-primary: linear-gradient(135deg, ${colors.primary}, ${colors.dark});\n`;
    css += `    --theme-gradient-accent: linear-gradient(90deg, ${colors.accent}, ${colors.primary});\n`;
    css += `    --theme-gradient-hero: linear-gradient(135deg, #d4a574 0%, #b8956a 50%, ${colors.primary} 100%);\n`;
    
    // Typografia
    css += '\n    /* Typografia */\n';
    css += `    --font-heading: ${fonts.heading};\n`;
    css += `    --font-body: ${fonts.body};\n`;
    
    // Spacing
    css += '\n    /* Spacing */\n';
    Object.keys(spacing).forEach(key => {
        css += `    --spacing-${key}: ${spacing[key]};\n`;
    });
    
    // Border radius
    css += '\n    /* Border radius */\n';
    Object.keys(radius).forEach(key => {
        css += `    --radius-${key}: ${radius[key]};\n`;
    });
    
    // Transitions
    css += '\n    /* Transitions */\n';
    css += '    --transition-fast: 0.2s;\n';
    css += '    --transition-normal: 0.3s;\n';
    css += '    --transition-slow: 0.4s;\n';
    css += '    --transition-curve: cubic-bezier(0.4, 0, 0.2, 1);\n';
    
    css += '}\n';
    
    return css;
}

/**
 * Zapisuje CSS do pliku
 * @param {String} filePath - Sciezka do pliku
 * @param {Object} config - Konfiguracja motywu
 */
function saveCSSToFile(filePath, config = themeConfig) {
    const fs = require('fs');
    const css = generateCSSVariables(config);
    
    fs.writeFileSync(filePath, css, 'utf8');
    console.log('CSS variables zapisane do:', filePath);
}

module.exports = {
    generateCSSVariables,
    saveCSSToFile
};
