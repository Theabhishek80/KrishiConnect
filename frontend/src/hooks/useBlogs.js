import { useEffect, useState } from "react";
import { fetchBlog, fetchBlogs } from "../services/blogService";

export function useBlogs(enabled = true) {
  const [state, setState] = useState({
    items: [],
    loading: enabled
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let alive = true;

    fetchBlogs().then(({ items }) => {
      if (alive) setState({ items, loading: false });
    });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return state;
}

export function useBlog(slug) {
  const [state, setState] = useState({ blog: null, loading: true });

  useEffect(() => {
    let alive = true;

    setState({ blog: null, loading: true });

    fetchBlog(slug).then(blog => {
      if (alive) setState({ blog, loading: false });
    });

    return () => {
      alive = false;
    };
  }, [slug]);

  return state;
}
