import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser } from "../../utils/auth";
import AdvertisementManager from "../Advertisement/AdvertisementManager";
import RecipeManager from "../Recipes/RecipeManager";

export default function AdminSectionPage({ section }) {
  const navigate = useNavigate();
  const user = getStoredUser();

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "ADMIN") navigate("/", { replace: true });
  }, [navigate, user?.role]);

  if (!user || user.role !== "ADMIN") return null;
  if (section === "recipes") return <RecipeManager />;
  if (section === "advertisements") return <AdvertisementManager />;
  return null;
}
