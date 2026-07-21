import { useEffect } from "react";

/* Per-route document title + meta description (SEO + share/browser-tab clarity). */
export function useDocumentTitle(title: string, description?: string) {
  useEffect(() => {
    document.title = `${title} · DéLa Já`;
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      meta?.setAttribute("content", description);
    }
  }, [title, description]);
}
