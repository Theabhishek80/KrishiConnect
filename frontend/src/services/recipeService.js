import api from "../api";
import { RECIPES as BUILT_IN_RECIPES } from "../data/content";

/*
 * Recipes live in the database (table "recipes") and are managed by the admin
 * in Admin panel > Recipes. The six original recipes were copied into the
 * database by migration V7, so they still appear.
 *
 * If the backend cannot be reached at all, the built-in copy in
 * data/content.js is shown instead so the page is never empty/broken.
 */

let cache = null;
let cacheTime = 0;
const CACHE_MS = 30 * 1000;

export function clearRecipeCache() {
  cache = null;
  cacheTime = 0;
}

export async function fetchRecipes() {
  if (cache && Date.now() - cacheTime < CACHE_MS) {
    return cache;
  }

  try {
    const { data } = await api.get("/recipes");

    const items = Array.isArray(data) ? data : [];

    cache = { items, offline: false };
    cacheTime = Date.now();

    return cache;
  } catch (error) {
    console.warn("Could not load recipes from the server, using built-in recipes.", error?.message);

    return { items: BUILT_IN_RECIPES, offline: true };
  }
}

export async function fetchRecipe(slug) {
  try {
    const { data } = await api.get(`/recipes/${encodeURIComponent(slug)}`);
    return data;
  } catch (error) {
    // Backend answered "not found" (400/404) -> it really does not exist,
    // unless it is one of the built-in ones and the server is unreachable.
    if (error?.response) {
      return null;
    }

    return BUILT_IN_RECIPES.find(r => r.slug === slug) || null;
  }
}
