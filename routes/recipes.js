"use strict";

const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();
const API_KEY = process.env.API_KEY;

// 🔹 Random Recipe
router.get("/random", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/random?apiKey=${API_KEY}&number=1`
    );

    const recipe = response.data.recipes[0];
    const simplified = {
      title: recipe.title,
      image: recipe.image,
      instructions: recipe.instructions,
      ingredients: recipe.extendedIngredients.map((ing) => ing.original)
    };

    res.json(simplified);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch random recipe" });
  }
});

// 🔹 Search Recipes
router.get("/search", async (req, res) => {
  const { ingredients } = req.query;

  if (!ingredients) {
    return res.status(400).json({ error: "Ingredients are required" });
  }

  try {
    const response = await axios.get(
      `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${API_KEY}&ingredients=${ingredients}&number=5`
    );

    const simplified = response.data.map((recipe) => ({
      title: recipe.title,
      image: recipe.image,
      usedIngredients: recipe.usedIngredients.map((ing) => ing.name),
      missedIngredients: recipe.missedIngredients.map((ing) => ing.name),
    }));

    res.json(simplified);
  } catch (error) {
    res.status(500).json({ error: "Failed to search recipes" });
  }
});

module.exports = router;