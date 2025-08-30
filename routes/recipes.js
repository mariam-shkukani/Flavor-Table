const express = require('express');
const axios = require('axios');
const router = express.Router();

const API_BASE = 'https://api.spoonacular.com';
const API_KEY = process.env.SPOONACULAR_API_KEY;

function ensureKey() {
  if (!API_KEY) {
    const err = new Error('Missing Spoonacular API key. Set SPOONACULAR_API_KEY in .env');
    err.status = 500;
    throw err;
  }
}

// b) Random Recipe
router.get('/random', async (req, res) => {
  try {
    ensureKey();
    const { data } = await axios.get(`${API_BASE}/recipes/random`, {
      params: { apiKey: API_KEY, number: 1 },
    });

    const r = data.recipes && data.recipes[0];
    if (!r) return res.status(404).json({ error: 'No random recipe found' });

    const instructionsText = r.instructions
      || (Array.isArray(r.analyzedInstructions) && r.analyzedInstructions[0]?.steps?.map(s => s.step).join(' '))
      || 'No instructions provided.';

    const ingredients = Array.isArray(r.extendedIngredients)
      ? r.extendedIngredients.map(i => i.original || i.name)
      : [];

    res.json({
      id: r.id,
      title: r.title,
      image: r.image,
      instructions: instructionsText,
      ingredients,
    });
  } catch (err) {
    console.error(err.message || err);
    res.status(err.status || 500).json({ error: 'Failed to fetch random recipe' });
  }
});

// c) Search by Ingredients
router.get('/search', async (req, res) => {
  try {
    ensureKey();
    const ingredients = (req.query.ingredients || '').trim();
    if (!ingredients) return res.status(400).json({ error: 'ingredients query is required, e.g. ?ingredients=chicken,tomato' });

    const { data } = await axios.get(`${API_BASE}/recipes/findByIngredients`, {
      params: {
        apiKey: API_KEY,
        ingredients,
        number: 12,
        ranking: 2,
        ignorePantry: true,
      },
    });

    const simplified = data.map(r => ({
      id: r.id,
      title: r.title,
      image: r.image,
      usedIngredients: (r.usedIngredients || []).map(i => i.name),
      missedIngredients: (r.missedIngredients || []).map(i => i.name),
    }));

    res.json(simplified);
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Failed to search recipes' });
  }
});

// (Bonus) Details by ID
router.get('/:id', async (req, res) => {
  try {
    ensureKey();
    const id = req.params.id;
    const { data } = await axios.get(`${API_BASE}/recipes/${id}/information`, {
      params: { apiKey: API_KEY, includeNutrition: false },
    });

    res.json({
      id: data.id,
      title: data.title,
      image: data.image,
      summary: data.summary,        // HTML string
      readyInMinutes: data.readyInMinutes,
      sourceUrl: data.sourceUrl,
    });
  } catch (err) {
    console.error(err.message || err);
    res.status(500).json({ error: 'Failed to fetch recipe details' });
  }
});

module.exports = router;