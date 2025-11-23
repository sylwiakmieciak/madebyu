const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const { Gallery, User } = require('../models');

// Konfiguracja multer dla uploadu zdjec
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/gallery');
    
    // Utworz folder jesli nie istnieje
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'img-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
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

    // Zapisz informacje o zdjeciu w bazie
    const image = await Gallery.create({
      user_id: req.user.id,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: `/uploads/gallery/${req.file.filename}`,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
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

    const images = await Promise.all(
      req.files.map(file => 
        Gallery.create({
          user_id: req.user.id,
          filename: file.filename,
          original_name: file.originalname,
          file_path: `/uploads/gallery/${file.filename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          alt_text: file.originalname
        })
      )
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
