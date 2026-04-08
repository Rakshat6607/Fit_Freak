const API_KEY = "0a480e58ffd74f429f36d7f8c5764468";
const BASE_URL = "https://api.spoonacular.com/recipes/complexSearch";

// DOM Elements
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const dietFilter = document.getElementById("dietFilter");
const cuisineFilter = document.getElementById("cuisineFilter");
const sortOrder = document.getElementById("sortOrder");
const recipesContainer = document.getElementById("recipesContainer");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMsg = document.getElementById("errorMsg");

// State for Likes and Favorites
let likedRecipes = JSON.parse(localStorage.getItem("fitfreak_likes")) || [];
let favoritedRecipes = JSON.parse(localStorage.getItem("fitfreak_favorites")) || [];

function saveToStorage() {
    localStorage.setItem("fitfreak_likes", JSON.stringify(likedRecipes));
    localStorage.setItem("fitfreak_favorites", JSON.stringify(favoritedRecipes));
}

function showLoading() {
    loadingIndicator.classList.remove("hidden");
    recipesContainer.innerHTML = "";
    errorMsg.classList.add("hidden");
}

function hideLoading() {
    loadingIndicator.classList.add("hidden");
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.classList.remove("hidden");
}

function getMacroValue(nutrientsArray, name) {
    let found = null;
    nutrientsArray.forEach(function(n) {
        if (n.name === name) {
            found = n;
        }
    });
    if (found) {
        return Math.round(found.amount) + found.unit;
    }
    return "N/A";
}

function createRecipeCard(recipe) {
    const nutrients = recipe.nutrition && recipe.nutrition.nutrients ? recipe.nutrition.nutrients : [];

    const calories = getMacroValue(nutrients, "Calories");
    const protein = getMacroValue(nutrients, "Protein");
    const carbs = getMacroValue(nutrients, "Carbohydrates");
    const fat = getMacroValue(nutrients, "Fat");

    const isLiked = likedRecipes.includes(recipe.id);
    const isFavorited = favoritedRecipes.includes(recipe.id);

    const card = document.createElement("div");
    card.classList.add("recipe-card");

    const img = document.createElement("img");
    img.classList.add("recipe-img");
    img.src = recipe.image || "https://via.placeholder.com/300x180?text=No+Image";
    img.alt = recipe.title;

    const body = document.createElement("div");
    body.classList.add("recipe-body");

    const title = document.createElement("p");
    title.classList.add("recipe-title");
    title.textContent = recipe.title;

    const macroGrid = document.createElement("div");
    macroGrid.classList.add("macro-grid");

    const macros = [
        { label: "Calories", value: calories },
        { label: "Protein", value: protein },
        { label: "Carbs", value: carbs },
        { label: "Fat", value: fat }
    ];

    macros.forEach(function(macro) {
        const item = document.createElement("div");
        item.classList.add("macro-item");

        const label = document.createElement("span");
        label.classList.add("macro-label");
        label.textContent = macro.label;

        const value = document.createElement("span");
        value.classList.add("macro-value");
        value.textContent = macro.value;

        item.appendChild(label);
        item.appendChild(value);
        macroGrid.appendChild(item);
    });

    // Action Buttons Row
    const actions = document.createElement("div");
    actions.classList.add("card-actions");

    const btnsLeft = document.createElement("div");
    btnsLeft.classList.add("action-btns-left");

    const likeBtn = document.createElement("button");
    likeBtn.classList.add("action-btn");
    if (isLiked) likeBtn.classList.add("liked");
    likeBtn.innerHTML = "❤️";
    likeBtn.addEventListener("click", () => toggleLike(recipe.id, likeBtn));

    const favBtn = document.createElement("button");
    favBtn.classList.add("action-btn");
    if (isFavorited) favBtn.classList.add("favorited");
    favBtn.innerHTML = "⭐";
    favBtn.addEventListener("click", () => toggleFavorite(recipe.id, favBtn));

    btnsLeft.appendChild(likeBtn);
    btnsLeft.appendChild(favBtn);

    const viewBtn = document.createElement("a");
    viewBtn.classList.add("view-recipe-btn");
    viewBtn.textContent = "VIEW RECIPE";
    viewBtn.href = `https://spoonacular.com/recipes/${recipe.title.replace(/\s+/g, "-").toLowerCase()}-${recipe.id}`;
    viewBtn.target = "_blank";

    actions.appendChild(btnsLeft);
    actions.appendChild(viewBtn);

    body.appendChild(title);
    body.appendChild(macroGrid);
    body.appendChild(actions);

    card.appendChild(img);
    card.appendChild(body);

    return card;
}

function toggleLike(id, btn) {
    if (likedRecipes.includes(id)) {
        likedRecipes = likedRecipes.filter(rid => rid !== id);
        btn.classList.remove("liked");
    } else {
        likedRecipes.push(id);
        btn.classList.add("liked");
    }
    saveToStorage();
}

function toggleFavorite(id, btn) {
    if (favoritedRecipes.includes(id)) {
        favoritedRecipes = favoritedRecipes.filter(rid => rid !== id);
        btn.classList.remove("favorited");
    } else {
        favoritedRecipes.push(id);
        btn.classList.add("favorited");
    }
    saveToStorage();
}

function renderRecipes(recipes) {
    recipesContainer.innerHTML = "";

    if (recipes.length === 0) {
        const noResults = document.createElement("div");
        noResults.classList.add("no-results");

        const icon = document.createElement("span");
        icon.textContent = "🥗";

        const msg = document.createElement("p");
        msg.textContent = "No recipes found. Try a different search!";

        noResults.appendChild(icon);
        noResults.appendChild(msg);
        recipesContainer.appendChild(noResults);
        return;
    }

    recipes.forEach(function(recipe) {
        const card = createRecipeCard(recipe);
        recipesContainer.appendChild(card);
    });
}

function searchRecipes() {
    const query = searchInput.value.trim();
    const diet = dietFilter.value;
    const cuisine = cuisineFilter.value;
    const sort = sortOrder.value;

    if (!query && !diet && !cuisine) {
        showError("Please enter a search term or select a filter.");
        return;
    }

    showLoading();

    let url = `${BASE_URL}?query=${encodeURIComponent(query)}&number=12&addRecipeNutrition=true&apiKey=${API_KEY}`;
    
    if (diet) url += `&diet=${diet}`;
    if (cuisine) url += `&cuisine=${cuisine}`;
    
    // Simple mapping for sorting
    if (sort === "calories") {
        url += "&sort=calories&sortDirection=asc";
    } else if (sort === "protein") {
        url += "&sort=protein&sortDirection=desc";
    } else if (sort === "time") {
        url += "&sort=time&sortDirection=asc";
    }

    fetch(url)
        .then(function(response) {
            if (!response.ok) {
                throw new Error("API request failed with status " + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            hideLoading();
            renderRecipes(data.results);
        })
        .catch(function(error) {
            hideLoading();
            showError("Something went wrong. Please check your connection and try again.");
            console.error(error);
        });
}

// Event Listeners
searchBtn.addEventListener("click", searchRecipes);

searchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        searchRecipes();
    }
});

// Auto-search on filter change
[dietFilter, cuisineFilter, sortOrder].forEach(el => {
    el.addEventListener("change", () => {
        if (searchInput.value.trim()) {
            searchRecipes();
        }
    });
});