"use client";

import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

interface PreviewProps {
  content: string;
  className?: string;
}

export function Preview({ content, className = "" }: PreviewProps) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPreview = async () => {
      if (!content.trim()) {
        setHtml("");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error("Failed to render preview");
        }

        const data = await response.json();
        // Sanitize HTML to prevent XSS
        const sanitizedHtml = DOMPurify.sanitize(data.html, {
          ADD_TAGS: ["iframe"],
          ADD_ATTR: ["target", "rel"],
        });
        setHtml(sanitizedHtml);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      } finally {
        setLoading(false);
      }
    };

    // Debounce the preview rendering
    const timer = setTimeout(renderPreview, 300);
    return () => clearTimeout(timer);
  }, [content]);

  if (error) {
    return (
      <div className={`p-4 text-red-500 ${className}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto relative ${className}`}>
      {loading && (
        <div className="absolute top-2 right-2 text-xs text-muted-foreground">
          Rendering...
        </div>
      )}
      <article
        className="prose prose-zinc dark:prose-invert max-w-none p-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
