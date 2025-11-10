// ============================================
// THEME ROUTES - Zarządzanie motywami
// ============================================
const express = require('express');
const { Theme, UserTheme } = require('../models');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/themes - Wszystkie aktywne motywy
// ============================================
router.get('/', async (req, res) => {
  try {
    const themes = await Theme.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'slug', 'primary_color', 'secondary_color', 'accent_color', 'is_default'],
      order: [['is_default', 'DESC'], ['name', 'ASC']]
    });

    res.json({ themes });
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
});

// ============================================
// POST /api/themes - Stwórz nowy motyw (ADMIN)
// ============================================
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, primary_color, secondary_color, accent_color } = req.body;

    if (!name || !primary_color || !secondary_color || !accent_color) {
      return res.status(400).json({ error: 'All fields required' });
    }

    // Walidacja kolorów (hex)
    const hexRegex = /^#[0-9A-F]{6}$/i;
    if (!hexRegex.test(primary_color) || !hexRegex.test(secondary_color) || !hexRegex.test(accent_color)) {
      return res.status(400).json({ error: 'Invalid color format. Use #RRGGBB' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const theme = await Theme.create({
      name,
      slug,
      primary_color,
      secondary_color,
      accent_color,
      created_by: req.user.id
    });

    res.status(201).json({ message: 'Theme created', theme });
  } catch (error) {
    console.error('Create theme error:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

// ============================================
// PUT /api/themes/:id/default - Ustaw jako domyślny (ADMIN)
// ============================================
router.put('/:id/default', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Usuń is_default ze wszystkich
    await Theme.update({ is_default: false }, { where: {} });

    // Ustaw nowy default
    const theme = await Theme.findByPk(id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    theme.is_default = true;
    await theme.save();

    res.json({ message: 'Default theme updated', theme });
  } catch (error) {
    console.error('Set default theme error:', error);
    res.status(500).json({ error: 'Failed to set default theme' });
  }
});

// ============================================
// DELETE /api/themes/:id - Usuń motyw (ADMIN)
// ============================================
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const theme = await Theme.findByPk(id);
    if (!theme) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    if (theme.is_default) {
      return res.status(400).json({ error: 'Cannot delete default theme' });
    }

    await theme.destroy();
    res.json({ message: 'Theme deleted' });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

// ============================================
// GET /api/themes/my - Pobierz motyw użytkownika
// ============================================
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const userTheme = await UserTheme.findOne({
      where: { user_id: req.user.id },
      include: [{
        model: Theme,
        as: 'theme',
        attributes: ['id', 'name', 'slug', 'primary_color', 'secondary_color', 'accent_color']
      }]
    });

    if (!userTheme) {
      // Zwróć domyślny
      const defaultTheme = await Theme.findOne({ where: { is_default: true } });
      return res.json({ theme: defaultTheme });
    }

    res.json({ theme: userTheme.theme });
  } catch (error) {
    console.error('Get user theme error:', error);
    res.status(500).json({ error: 'Failed to get user theme' });
  }
});

// ============================================
// POST /api/themes/select - Wybierz motyw
// ============================================
router.post('/select', authMiddleware, async (req, res) => {
  try {
    const { theme_id } = req.body;

    if (!theme_id) {
      return res.status(400).json({ error: 'Theme ID required' });
    }

    // Sprawdź czy motyw istnieje
    const theme = await Theme.findByPk(theme_id);
    if (!theme || !theme.is_active) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    // Sprawdź czy user już ma wybrany motyw
    let userTheme = await UserTheme.findOne({ where: { user_id: req.user.id } });

    if (userTheme) {
      userTheme.theme_id = theme_id;
      await userTheme.save();
    } else {
      userTheme = await UserTheme.create({
        user_id: req.user.id,
        theme_id
      });
    }

    res.json({ message: 'Theme selected', theme });
  } catch (error) {
    console.error('Select theme error:', error);
    res.status(500).json({ error: 'Failed to select theme' });
  }
});

module.exports = router;
