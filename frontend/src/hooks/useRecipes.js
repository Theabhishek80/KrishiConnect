import { useEffect, useState } from "react";
import { fetchRecipe, fetchRecipes } from "../services/recipeService";

export function useRecipes(enabled = true) {
  const [state, setState] = useState({
    items: [],
    loading: enabled
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let alive = true;

    fetchRecipes().then(({ items }) => {
      if (alive) setState({ items, loading: false });
    });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return state;
}

export function useRecipe(slug) {
  const [state, setState] = useState({ recipe: null, loading: true });

  useEffect(() => {
    let alive = true;

    setState({ recipe: null, loading: true });

    fetchRecipe(slug).then(recipe => {
      if (alive) setState({ recipe, loading: false });
    });

    return () => {
      alive = false;
    };
  }, [slug]);

  return state;
}
