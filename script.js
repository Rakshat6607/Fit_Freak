const API_KEY = "0a480e58ffd74f429f36d7f8c5764468";
const BASE_URL = "https://api.spoonacular.com/recipes/complexSearch";

const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const recipesContainer = document.getElementById("recipesContainer");
const loadingIndicator = document.getElementById("loadingIndicator");
const errorMsg = document.getElementById("errorMsg");

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

    body.appendChild(title);
    body.appendChild(macroGrid);

    card.appendChild(img);
    card.appendChild(body);

    return card;
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

    if (!query) {
        showError("Please enter a search term.");
        return;
    }

    showLoading();

    const url = BASE_URL + "?query=" + encodeURIComponent(query) + "&number=12&addRecipeNutrition=true&apiKey=" + API_KEY;

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

searchBtn.addEventListener("click", searchRecipes);

searchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        searchRecipes();
    }
});