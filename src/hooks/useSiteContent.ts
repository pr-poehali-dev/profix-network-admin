import { useState, useEffect } from "react";
import { fetchContent, getString, getJson } from "@/lib/content-api";

type ContentMap = Record<string, string>;

export function useSiteContent() {
  const [content, setContent] = useState<ContentMap>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetchContent().then(c => { setContent(c); setReady(true); });
  }, []);

  return {
    ready,
    str: (key: string, fallback = "") => getString(content, key, fallback),
    json: <T>(key: string, fallback: T) => getJson<T>(content, key, fallback),
  };
}
