import api from "../api";
import { BLOGS as BUILT_IN_BLOGS } from "../data/content";

/*
 * Blogs live in the database (table "blogs") and are managed by the admin in
 * Admin panel > Blogs. The six original blogs were copied into the database
 * by migration V13, so they still appear.
 *
 * If the backend cannot be reached at all, the built-in copy in
 * data/content.js is shown instead so the page is never empty/broken.
 */

let cache = null;
let cacheTime = 0;
const CACHE_MS = 30 * 1000;

export function clearBlogCache() {
  cache = null;
  cacheTime = 0;
}

export async function fetchBlogs() {
  if (cache && Date.now() - cacheTime < CACHE_MS) {
    return cache;
  }

  try {
    const { data } = await api.get("/blogs");

    const items = Array.isArray(data) ? data : [];

    cache = { items, offline: false };
    cacheTime = Date.now();

    return cache;
  } catch (error) {
    console.warn("Could not load blogs from the server, using built-in blogs.", error?.message);

    return { items: BUILT_IN_BLOGS, offline: true };
  }
}

export async function fetchBlog(slug) {
  try {
    const { data } = await api.get(`/blogs/${encodeURIComponent(slug)}`);
    return data;
  } catch (error) {
    // The server answered "not found" -> it really does not exist
    // (or the admin hid it). Only fall back when the server is unreachable.
    if (error?.response) {
      return null;
    }

    return BUILT_IN_BLOGS.find(b => b.slug === slug) || null;
  }
}
