const express = require("express");
const validator = require("validator");
const products = require("../data/products.json");
const { calculateGreenGrade } = require("../services/greengrade");
const { validate } = require("../middleware/validate");

const router = express.Router();

const TAG_QUERY_SCHEMA = {
  query: {
    tag: { required: false, type: "string", maxLength: 50 },
  },
};

const RECIPE_ID_SCHEMA = {
  params: {
    id: {
      required: true,
      type: "string",
      maxLength: 50,
      pattern: /^[a-z0-9-]+$/,
      message: "Invalid recipe ID",
    },
  },
};

// Curated recipe templates with ingredient categories
const RECIPE_TEMPLATES = [
  {
    id: "green-bowl",
    name: "Green Power Bowl",
    description:
      "A nutrient-dense bowl packed with sustainable grains, fresh vegetables, and plant protein.",
    servings: 2,
    prepTime: "15 min",
    cookTime: "20 min",
    ingredientCategories: ["Grains", "Vegetables", "Protein"],
    instructions: [
      "Cook your grain base according to package directions",
      "Wash and chop fresh vegetables into bite-sized pieces",
      "Prepare your protein source (steam, bake, or pan-sear)",
      "Assemble bowls: grain base, topped with veggies and protein",
      "Drizzle with olive oil, lemon juice, salt, and pepper",
    ],
    tags: ["healthy", "quick", "high-protein"],
  },
  {
    id: "sustainable-smoothie",
    name: "Eco Smoothie Blast",
    description:
      "A refreshing smoothie using low-emission fruits, dairy alternatives, and natural sweeteners.",
    servings: 2,
    prepTime: "5 min",
    cookTime: "0 min",
    ingredientCategories: ["Fruits", "Dairy & Eggs", "Beverages"],
    instructions: [
      "Add fruits to blender (fresh or frozen)",
      "Pour in your choice of milk or dairy alternative",
      "Add a natural sweetener if desired (honey, dates)",
      "Blend until smooth and creamy",
      "Pour into glasses and serve immediately",
    ],
    tags: ["quick", "no-cook", "breakfast"],
  },
  {
    id: "planet-friendly-pasta",
    name: "Planet-Friendly Pasta",
    description:
      "A delicious pasta dish featuring sustainable grains with seasonal vegetables and light sauce.",
    servings: 4,
    prepTime: "10 min",
    cookTime: "25 min",
    ingredientCategories: ["Grains", "Vegetables", "Pantry"],
    instructions: [
      "Cook pasta in salted boiling water until al dente",
      "Saut\u00e9 garlic and vegetables in olive oil",
      "Combine pasta with vegetables",
      "Add pantry staples (tomato sauce, herbs, spices)",
      "Toss together and serve with fresh herbs",
    ],
    tags: ["comfort-food", "family", "vegetarian"],
  },
  {
    id: "low-carbon-stir-fry",
    name: "Low-Carbon Stir-Fry",
    description: "A quick stir-fry that maximizes flavor while minimizing environmental impact.",
    servings: 3,
    prepTime: "10 min",
    cookTime: "10 min",
    ingredientCategories: ["Vegetables", "Protein", "Pantry"],
    instructions: [
      "Prep all vegetables: wash, peel, and cut into uniform pieces",
      "Heat a wok or large pan over high heat with oil",
      "Stir-fry protein until cooked through, set aside",
      "Stir-fry vegetables in batches (hard veggies first)",
      "Combine everything, add sauce (soy, ginger, garlic), serve over rice",
    ],
    tags: ["quick", "asian-inspired", "high-protein"],
  },
  {
    id: "eco-breakfast",
    name: "Sustainable Breakfast Plate",
    description:
      "Start your day right with a balanced, low-emission breakfast featuring local-friendly ingredients.",
    servings: 2,
    prepTime: "5 min",
    cookTime: "15 min",
    ingredientCategories: ["Dairy & Eggs", "Grains", "Fruits"],
    instructions: [
      "Toast or warm your grain of choice",
      "Prepare eggs or dairy (scramble, poach, or serve yogurt)",
      "Wash and slice fresh seasonal fruits",
      "Plate everything together in an appealing arrangement",
      "Add a drizzle of honey or a sprinkle of seeds",
    ],
    tags: ["breakfast", "balanced", "quick"],
  },
  {
    id: "ocean-friendly-bowl",
    name: "Ocean-Friendly Poke Bowl",
    description:
      "A sustainable take on poke bowls using responsibly sourced seafood and fresh produce.",
    servings: 2,
    prepTime: "15 min",
    cookTime: "20 min",
    ingredientCategories: ["Seafood", "Grains", "Vegetables"],
    instructions: [
      "Cook sushi rice or your preferred grain",
      "Prepare sustainable seafood (cube for raw, or cook through)",
      "Julienne or slice vegetables for toppings",
      "Assemble bowls: rice base, seafood, vegetables",
      "Top with sesame seeds, soy sauce, and a squeeze of lime",
    ],
    tags: ["seafood", "japanese-inspired", "healthy"],
  },
];

function getGreenIngredients(category, limit = 3) {
  const categoryProducts = products
    .filter((p) => p.category === category)
    .map((p) => ({ ...p, greenGrade: calculateGreenGrade(p.emissions) }))
    .sort((a, b) => b.greenGrade.score - a.greenGrade.score)
    .slice(0, limit);

  return categoryProducts.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    score: p.greenGrade.score,
    emissions: p.greenGrade.totalEmissions,
  }));
}

// GET /api/recipes - get recipe suggestions with green ingredients
router.get("/", validate(TAG_QUERY_SCHEMA), (req, res) => {
  const rawTag = req.query.tag;

  let filtered = RECIPE_TEMPLATES;
  if (rawTag) {
    const tag = validator.escape(validator.trim(rawTag)).slice(0, 50).toLowerCase();
    filtered = filtered.filter((r) => r.tags.includes(tag));
  }

  const recipes = filtered.map((recipe) => {
    const ingredients = {};
    let totalScore = 0;
    let categoryCount = 0;

    recipe.ingredientCategories.forEach((cat) => {
      const greenOptions = getGreenIngredients(cat);
      ingredients[cat] = greenOptions;
      if (greenOptions.length > 0) {
        totalScore += greenOptions.reduce((s, p) => s + p.score, 0) / greenOptions.length;
        categoryCount++;
      }
    });

    return {
      ...recipe,
      ingredients,
      sustainabilityScore:
        categoryCount > 0 ? Math.round((totalScore / categoryCount) * 10) / 10 : 0,
    };
  });

  res.json({ recipes });
});

// GET /api/recipes/:id - get single recipe
router.get("/:id", validate(RECIPE_ID_SCHEMA), (req, res) => {
  const recipeId = req.params.id;
  const recipe = RECIPE_TEMPLATES.find((r) => r.id === recipeId);
  if (!recipe) {
    return res.status(404).json({ error: "Recipe not found" });
  }

  const ingredients = {};
  let totalScore = 0;
  let categoryCount = 0;

  recipe.ingredientCategories.forEach((cat) => {
    const greenOptions = getGreenIngredients(cat, 5);
    ingredients[cat] = greenOptions;
    if (greenOptions.length > 0) {
      totalScore += greenOptions.reduce((s, p) => s + p.score, 0) / greenOptions.length;
      categoryCount++;
    }
  });

  res.json({
    ...recipe,
    ingredients,
    sustainabilityScore: categoryCount > 0 ? Math.round((totalScore / categoryCount) * 10) / 10 : 0,
  });
});

module.exports = router;
