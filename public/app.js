const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const randomBtn = document.getElementById("randomBtn");
const randomContainer = document.getElementById("randomRecipe");
const favoritesContainer = document.getElementById("favoritesContainer");
const detailsContainer = document.getElementById("recipeDetails");


const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
  searchBtn.addEventListener("click", async () => {
    const ingredients = document.getElementById("ingredients").value;
    const res = await fetch(`/recipes/search?ingredients=${ingredients}`);
    const data = await res.json();

    const results = document.getElementById("results");
    results.innerHTML = "";

    data.forEach((recipe) => {
      const card = document.createElement("div");
      card.innerHTML = `
        <h3>${recipe.title}</h3>
        <img src="${recipe.image}" width="200"/>
        <p><b>Used:</b> ${recipe.usedIngredients.join(", ")}</p>
        <p><b>Missing:</b> ${recipe.missedIngredients.join(", ")}</p>
        <button onclick="saveFavorite('${recipe.title}', '${recipe.image}')">Save to Favorites</button>
      `;
      results.appendChild(card);
    });
  });
}

if (randomBtn) {
  randomBtn.addEventListener("click", async () => {
    const res = await fetch("/recipes/random");
    const recipe = await res.json();

    const randomResult = document.getElementById("randomResult");
    randomResult.innerHTML = `
    <div class="recipe-card">
      <h2>${recipe.title}</h2>
         <p>${recipe.instructions?.substring(0, 100)}</p>
      <img src="${recipe.image}" width="200"/>
      <p>${recipe.instructions || "No instructions available"}</p>
      <ul>${recipe.ingredients.map((ing) => `<li>${ing}</li>`).join("")}</ul>
      <button onclick="saveFavorite('${recipe.title}', '${recipe.image}')">Save to Favorites</button>
    `;
  });
}

// // ========== Favorites ==========
async function saveFavorite(title, image) {
  try {
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, image })
    });
    const data = await res.json();
    alert("Recipe saved 🟢");
  } catch (err) {
    console.error(err);
    alert("Failed to save recipe.");
  }
}

async function loadFavorites() {
  try {
    const res = await fetch("/api/recipes/all"); 
    const favorites = await res.json();
    const favoritesList = document.getElementById("favoritesList");
    favoritesList.innerHTML = "";
    favorites.forEach((f, index) => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${f.title}</h3>
        <img src="${f.image}" width="200"/>
        <button onclick="removeFavorite(${f.id})">Remove</button>
      `;
      favoritesList.appendChild(div);
    });
  } catch (err) {
    console.error(err);
  }
}

loadFavorites(); 

async function removeFavorite(id) {
  try {
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    alert("Recipe removed from database!");
    loadFavorites();
  } catch (err) {
    console.error(err);
  }
}
