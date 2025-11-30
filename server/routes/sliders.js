// SLIDERS ROUTES - Endpointy dla slajderów

const express = require('express');
const router = express.Router();
const { Slider, SliderProduct, Product, ProductImage, User } = require('../models');
const { authMiddleware } = require('../middleware/auth');


// GET /api/sliders - Pobierz wszystkie slajdery (admin)

router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const sliders = await Slider.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'full_name']
        },
        {
          model: SliderProduct,
          as: 'sliderProducts',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'title', 'price'],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  where: { is_primary: true },
                  required: false,
                  attributes: ['image_url']
                }
              ]
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Przekształć dane, aby Products był prostszą tablicą
    const slidersWithProducts = sliders.map(slider => {
      const sliderData = slider.toJSON();
      sliderData.Products = sliderData.sliderProducts
        .filter(sp => sp.product)
        .map(sp => ({
          ...sp.product,
          display_order: sp.display_order,
          ProductImages: sp.product.images || []
        }))
        .sort((a, b) => a.display_order - b.display_order);
      delete sliderData.sliderProducts;
      return sliderData;
    });

    res.json({ sliders: slidersWithProducts });
  } catch (error) {
    console.error('Get sliders error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać slajderów' });
  }
});


// GET /api/sliders/active - Pobierz aktywny slajder (publiczny)

router.get('/active', async (req, res) => {
  try {
    const slider = await Slider.findOne({
      where: { is_active: true }
    });

    if (!slider) {
      return res.json({ slider: null, products: [] });
    }

    // Pobierz produkty dla tego slajdera
    const sliderProducts = await SliderProduct.findAll({
      where: { slider_id: slider.id },
      include: [
        {
          model: Product,
          as: 'product',
          where: { status: 'published' },
          required: true,
          include: [
            {
              model: ProductImage,
              as: 'images',
              attributes: ['id', 'image_url', 'is_primary']
            },
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'username', 'avatar_url']
            }
          ]
        }
      ],
      order: [['display_order', 'ASC']]
    });

    const products = sliderProducts.map(sp => ({
      ...sp.product.toJSON(),
      display_order: sp.display_order
    }));

    res.json({ slider, products });
  } catch (error) {
    console.error('Get active slider error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać aktywnego slajdera' });
  }
});


// POST /api/sliders - Utwórz nowy slajder (admin)

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Nazwa slajdera jest wymagana' });
    }

    // Sprawdź czy nazwa już istnieje
    const existing = await Slider.findOne({ where: { name: name.trim() } });
    if (existing) {
      return res.status(400).json({ error: 'Slajder o tej nazwie już istnieje' });
    }

    const slider = await Slider.create({
      name: name.trim(),
      is_active: false,
      created_by: req.user.id
    });

    res.json({ slider });
  } catch (error) {
    console.error('Create slider error:', error);
    res.status(500).json({ error: 'Nie udało się utworzyć slajdera' });
  }
});


// PUT /api/sliders/:id/activate - Ustaw slajder jako aktywny (admin)

router.put('/:id/activate', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const slider = await Slider.findByPk(req.params.id);
    if (!slider) {
      return res.status(404).json({ error: 'Slajder nie znaleziony' });
    }

    // Dezaktywuj wszystkie slajdery
    await Slider.update({ is_active: false }, { where: {} });

    // Aktywuj wybrany
    slider.is_active = true;
    await slider.save();

    res.json({ message: 'Slajder aktywowany', slider });
  } catch (error) {
    console.error('Activate slider error:', error);
    res.status(500).json({ error: 'Nie udało się aktywować slajdera' });
  }
});


// DELETE /api/sliders/:id - Usuń slajder (admin)

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const slider = await Slider.findByPk(req.params.id);
    if (!slider) {
      return res.status(404).json({ error: 'Slajder nie znaleziony' });
    }

    await slider.destroy();
    res.json({ message: 'Slajder usunięty' });
  } catch (error) {
    console.error('Delete slider error:', error);
    res.status(500).json({ error: 'Nie udało się usunąć slajdera' });
  }
});


// POST /api/sliders/:id/products - Dodaj produkt do slajdera (admin)

router.post('/:id/products', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { product_id, display_order } = req.body;

    const slider = await Slider.findByPk(req.params.id);
    if (!slider) {
      return res.status(404).json({ error: 'Slajder nie znaleziony' });
    }

    const product = await Product.findOne({
      where: { id: product_id, status: 'published' }
    });
    if (!product) {
      return res.status(404).json({ error: 'Produkt nie znaleziony' });
    }

    // Sprawdź czy produkt już jest w slajderze
    const existing = await SliderProduct.findOne({
      where: { slider_id: slider.id, product_id }
    });
    if (existing) {
      return res.status(400).json({ error: 'Produkt już jest w slajderze' });
    }

    // Jeśli nie podano display_order, użyj maksymalnej wartości + 1
    let order = display_order;
    if (order === undefined || order === null) {
      const maxOrder = await SliderProduct.max('display_order', {
        where: { slider_id: slider.id }
      });
      order = (maxOrder || 0) + 1;
    }

    const sliderProduct = await SliderProduct.create({
      slider_id: slider.id,
      product_id,
      display_order: order
    });

    res.json({ sliderProduct });
  } catch (error) {
    console.error('Add product to slider error:', error);
    res.status(500).json({ error: 'Nie udało się dodać produktu do slajdera' });
  }
});


// DELETE /api/sliders/:id/products/:productId - Usuń produkt ze slajdera (admin)

router.delete('/:id/products/:productId', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const sliderProduct = await SliderProduct.findOne({
      where: {
        slider_id: req.params.id,
        product_id: req.params.productId
      }
    });

    if (!sliderProduct) {
      return res.status(404).json({ error: 'Produkt nie znaleziony w slajderze' });
    }

    await sliderProduct.destroy();
    res.json({ message: 'Produkt usunięty ze slajdera' });
  } catch (error) {
    console.error('Remove product from slider error:', error);
    res.status(500).json({ error: 'Nie udało się usunąć produktu ze slajdera' });
  }
});


// PUT /api/sliders/:id/products/reorder - Zmień kolejność produktów (admin)

router.put('/:id/products/reorder', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { products } = req.body; // Array of { product_id, display_order }

    if (!Array.isArray(products)) {
      return res.status(400).json({ error: 'Nieprawidłowe dane' });
    }

    // Aktualizuj kolejność
    for (const item of products) {
      await SliderProduct.update(
        { display_order: item.display_order },
        {
          where: {
            slider_id: req.params.id,
            product_id: item.product_id
          }
        }
      );
    }

    res.json({ message: 'Kolejność zaktualizowana' });
  } catch (error) {
    console.error('Reorder slider products error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować kolejności' });
  }
});

module.exports = router;
