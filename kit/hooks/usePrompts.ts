import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Prompt, PromptCategory } from "../types";

export function usePrompts() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      supabase
        .from("prompt_categories")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("prompts")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]).then(([cats, proms]) => {
      if (cancelled) return;
      setCategories((cats.data ?? []) as PromptCategory[]);
      setPrompts((proms.data ?? []) as Prompt[]);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const promptsByCategory = useMemo(() => {
    const map = new Map<string, Prompt[]>();
    for (const p of prompts) {
      const list = map.get(p.category_id) ?? [];
      list.push(p);
      map.set(p.category_id, list);
    }
    return map;
  }, [prompts]);

  const getPromptsByCategory = (categoryId: string) =>
    promptsByCategory.get(categoryId) ?? [];

  return { categories, prompts, loading, getPromptsByCategory };
}

