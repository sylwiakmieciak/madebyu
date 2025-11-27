const express = require('express');
const router = express.Router();
const { ProductComment, User, Product } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Dodaj komentarz do produktu (wymagane zalogowanie)
router.post('/product/:productId', authMiddleware, async (req, res) => {
  try {
    const { productId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    console.log('=== ADD COMMENT REQUEST ===');
    console.log('Product ID:', productId);
    console.log('User ID:', userId);
    console.log('Comment:', comment);

    if (!comment || !comment.trim()) {
      console.log('ERROR: Empty comment');
      return res.status(400).json({ message: 'Komentarz nie może być pusty' });
    }

    // Sprawdź czy produkt istnieje
    const product = await Product.findByPk(productId);
    if (!product) {
      console.log('ERROR: Product not found');
      return res.status(404).json({ message: 'Produkt nie znaleziony' });
    }

    console.log('Product found:', product.title);

    const newComment = await ProductComment.create({
      product_id: productId,
      user_id: userId,
      comment: comment.trim(),
      approved: false
    });

    console.log('Comment created:', newComment.id);

    // Pobierz komentarz z danymi użytkownika
    const commentWithUser = await ProductComment.findByPk(newComment.id, {
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'username', 'full_name', 'avatar_url']
      }]
    });

    console.log('Comment saved successfully');
    res.status(201).json({
      message: 'Komentarz dodany',
      comment: commentWithUser
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Błąd podczas dodawania komentarza' });
  }
});

// Pobierz komentarze dla produktu (zatwierdzone + własne niezatwierdzone)
router.get('/product/:productId', optionalAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id; // Może być niezalogowany

    let whereConditions = {
      product_id: productId
    };

    // Jeśli użytkownik jest zalogowany, pokaż zatwierdzone + jego własne niezatwierdzone
    if (userId) {
      whereConditions = {
        product_id: productId,
        [Op.or]: [
          { approved: true },
          { user_id: userId, approved: false }
        ]
      };
    } else {
      // Jeśli niezalogowany, tylko zatwierdzone
      whereConditions.approved = true;
    }

    const comments = await ProductComment.findAll({
      where: whereConditions,
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'username', 'full_name', 'avatar_url']
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      comments,
      total: comments.length
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania komentarzy' });
  }
});

// Usuń własny komentarz
router.delete('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    const comment = await ProductComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentarz nie znaleziony' });
    }

    // Tylko właściciel komentarza lub admin może usunąć
    if (comment.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    await comment.destroy();
    res.json({ message: 'Komentarz usunięty' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania komentarza' });
  }
});

// Edytuj własny komentarz
router.put('/:commentId', authMiddleware, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment: newComment } = req.body;
    const userId = req.user.id;

    if (!newComment || !newComment.trim()) {
      return res.status(400).json({ message: 'Komentarz nie może być pusty' });
    }

    const comment = await ProductComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentarz nie znaleziony' });
    }

    if (comment.user_id !== userId) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    // Nie można edytować zatwierdzonego komentarza
    if (comment.approved) {
      return res.status(403).json({ message: 'Nie można edytować zatwierdzonego komentarza' });
    }

    comment.comment = newComment.trim();
    await comment.save();

    const updatedComment = await ProductComment.findByPk(commentId, {
      include: [{
        model: User,
        as: 'User',
        attributes: ['id', 'username', 'full_name', 'avatar_url']
      }]
    });

    res.json({
      message: 'Komentarz zaktualizowany',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ message: 'Błąd podczas aktualizacji komentarza' });
  }
});

// ADMIN: Pobierz wszystkie niezatwierdzone komentarze
router.get('/admin/pending', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    console.log('=== ADMIN PENDING COMMENTS REQUEST ===');
    console.log('User ID:', userId);
    console.log('User role:', user?.role);
    console.log('Can moderate comments:', user?.can_moderate_comments);

    if (!user || (user.role !== 'admin' && !user.can_moderate_comments)) {
      console.log('Access denied - not authorized');
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const pendingComments = await ProductComment.findAll({
      where: { approved: false },
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'title']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log('Found pending comments:', pendingComments.length);
    if (pendingComments.length > 0) {
      console.log('Sample comment:', {
        id: pendingComments[0].id,
        comment: pendingComments[0].comment,
        approved: pendingComments[0].approved,
        product: pendingComments[0].product?.title
      });
    }

    res.json({
      comments: pendingComments,
      total: pendingComments.length
    });
  } catch (error) {
    console.error('Error fetching pending comments:', error);
    res.status(500).json({ message: 'Błąd podczas pobierania komentarzy' });
  }
});

// ADMIN: Zatwierdź komentarz
router.put('/admin/:commentId/approve', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || (user.role !== 'admin' && !user.can_moderate_comments)) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const comment = await ProductComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentarz nie znaleziony' });
    }

    comment.approved = true;
    await comment.save();

    res.json({
      message: 'Komentarz zatwierdzony',
      comment
    });
  } catch (error) {
    console.error('Error approving comment:', error);
    res.status(500).json({ message: 'Błąd podczas zatwierdzania komentarza' });
  }
});

// ADMIN: Odrzuć (usuń) komentarz
router.delete('/admin/:commentId/reject', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { commentId } = req.params;

    const user = await User.findByPk(userId);
    if (!user || (user.role !== 'admin' && !user.can_moderate_comments)) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }

    const comment = await ProductComment.findByPk(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Komentarz nie znaleziony' });
    }

    await comment.destroy();

    res.json({
      message: 'Komentarz odrzucony i usunięty'
    });
  } catch (error) {
    console.error('Error rejecting comment:', error);
    res.status(500).json({ message: 'Błąd podczas usuwania komentarza' });
  }
});

module.exports = router;
