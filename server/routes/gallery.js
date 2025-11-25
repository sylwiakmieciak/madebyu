const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { Gallery, User } = require('../models');

// Konfiguracja multer dla uploadu zdjec - używamy memory storage dla sharp
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (przed kompresją)
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Tylko pliki obrazow (JPEG, PNG, GIF, WebP) sa dozwolone'));
    }
  }
});

// GET /api/gallery - Pobierz galerie uzytkownika
router.get('/', authMiddleware, async (req, res) => {
  try {
    const images = await Gallery.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });

    res.json(images);
  } catch (error) {
    console.error('[ERROR] Gallery fetch failed:', error);
    res.status(500).json({ error: 'Failed to load gallery' });
  }
});

// POST /api/gallery/upload - Upload nowego zdjecia
router.post('/upload', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadDir = path.join(__dirname, '../../uploads/gallery');
    
    // Utworz folder jesli nie istnieje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generuj unikalna nazwe pliku
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'img-' + uniqueSuffix + '.webp';
    const filepath = path.join(uploadDir, filename);

    // Skaluj i kompresuj obraz używając sharp
    await sharp(req.file.buffer)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    // Pobierz informacje o zoptymalizowanym pliku
    const stats = fs.statSync(filepath);

    // Zapisz informacje o zdjeciu w bazie
    const image = await Gallery.create({
      user_id: req.user.id,
      filename: filename,
      original_name: req.file.originalname,
      file_path: `/uploads/gallery/${filename}`,
      file_size: stats.size,
      mime_type: 'image/webp',
      alt_text: req.body.alt_text || req.file.originalname
    });

    res.status(201).json(image);
  } catch (error) {
    console.error('[ERROR] Gallery upload failed:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// POST /api/gallery/upload-multiple - Upload wielu zdjec
router.post('/upload-multiple', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadDir = path.join(__dirname, '../../uploads/gallery');
    
    // Utworz folder jesli nie istnieje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const images = await Promise.all(
      req.files.map(async (file) => {
        // Generuj unikalna nazwe pliku
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = 'img-' + uniqueSuffix + '.webp';
        const filepath = path.join(uploadDir, filename);

        // Skaluj i kompresuj obraz
        await sharp(file.buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(filepath);

        // Pobierz informacje o zoptymalizowanym pliku
        const stats = fs.statSync(filepath);

        return Gallery.create({
          user_id: req.user.id,
          filename: filename,
          original_name: file.originalname,
          file_path: `/uploads/gallery/${filename}`,
          file_size: stats.size,
          mime_type: 'image/webp',
          alt_text: file.originalname
        });
      })
    );

    res.status(201).json(images);
  } catch (error) {
    console.error('[ERROR] Multiple gallery upload failed:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// DELETE /api/gallery/:id - Usun zdjecie z galerii
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const image = await Gallery.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Usun plik z dysku
    const filePath = path.join(__dirname, '../../uploads/gallery', image.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Usun z bazy
    await image.destroy();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('[ERROR] Gallery delete failed:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// PUT /api/gallery/:id - Aktualizuj alt text zdjecia
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const image = await Gallery.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await image.update({
      alt_text: req.body.alt_text || image.alt_text
    });

    res.json(image);
  } catch (error) {
    console.error('[ERROR] Gallery update failed:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

module.exports = router;
