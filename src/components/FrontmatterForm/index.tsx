"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface FrontmatterFormProps {
  frontmatter: Record<string, unknown>;
  onChange: (frontmatter: Record<string, unknown>) => void;
  className?: string;
  activePath?: string; // Path to current file (for image uploads)
  body?: string; // Post content body (for meta description generation)
}

/**
 * Extract a clean meta description from markdown content
 * - Removes markdown formatting
 * - Takes first 1-2 sentences
 * - Truncates at ~155 chars on word boundary
 */
function generateMetaDescription(content: string, maxLength = 155): string {
  if (!content || content.trim().length === 0) return "";

  // Remove markdown formatting
  let clean = content
    // Remove images
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // Remove blockquotes
    .replace(/^>\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Remove list markers
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Collapse whitespace
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length === 0) return "";

  // Try to get 1-2 complete sentences
  const sentences = clean.match(/[^.!?]+[.!?]+/g) || [clean];
  let result = "";

  for (const sentence of sentences) {
    if (result.length + sentence.length <= maxLength) {
      result += sentence;
    } else if (result.length === 0) {
      // First sentence is too long, truncate at word boundary
      result = sentence.slice(0, maxLength);
      const lastSpace = result.lastIndexOf(" ");
      if (lastSpace > maxLength * 0.7) {
        result = result.slice(0, lastSpace);
      }
      result = result.trim() + "...";
      break;
    } else {
      break;
    }
  }

  return result.trim();
}

export function FrontmatterForm({
  frontmatter,
  onChange,
  className = "",
  activePath,
  body,
}: FrontmatterFormProps) {
  const [expanded, setExpanded] = useState(true);
  const [tagsInput, setTagsInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize tags input from frontmatter
  useEffect(() => {
    if (Array.isArray(frontmatter.tags)) {
      setTagsInput(frontmatter.tags.join(", "));
    }
  }, [frontmatter.tags]);

  const handleChange = useCallback((field: string, value: unknown) => {
    onChange({ ...frontmatter, [field]: value });
  }, [onChange, frontmatter]);

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    handleChange("tags", tags);
  };

  const handleImageUpload = useCallback(async (file: File) => {
    if (!activePath) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetPath", activePath);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await response.json();
      // Use the markdown-relative path for frontmatter
      handleChange("featuredImage", data.markdownPath);
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [activePath, handleChange]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  }, [handleImageUpload]);

  return (
    <div
      className={`border-b border-border bg-muted ${className}`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-sm font-medium text-muted-foreground hover:bg-background/50"
      >
        <span>Frontmatter</span>
        <span>{expanded ? "▼" : "▶"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Title
            </label>
            <input
              type="text"
              value={(frontmatter.title as string) || ""}
              onChange={(e) => handleChange("title", e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background"
            />
          </div>

          {/* Author & Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Author
              </label>
              <input
                type="text"
                value={(frontmatter.author as string) || ""}
                onChange={(e) => handleChange("author", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Published At
              </label>
              <input
                type="date"
                value={(frontmatter.publishedAt as string) || ""}
                onChange={(e) => handleChange("publishedAt", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background"
              />
            </div>
          </div>

          {/* Status & Featured row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Status
              </label>
              <select
                value={(frontmatter.status as string) || "draft"}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={frontmatter.featured === true}
                  onChange={(e) => handleChange("featured", e.target.checked)}
                  className="rounded"
                />
                <span className="text-muted-foreground">Featured</span>
              </label>
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Excerpt
            </label>
            <textarea
              value={(frontmatter.excerpt as string) || ""}
              onChange={(e) => handleChange("excerpt", e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="tag1, tag2, tag3"
              className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Featured Image
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={(frontmatter.featuredImage as string) || ""}
                onChange={(e) => handleChange("featuredImage", e.target.value)}
                placeholder="./images/..."
                className="flex-1 px-3 py-1.5 text-sm border border-border rounded bg-background"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !activePath}
                className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title={!activePath ? "Save file first to enable uploads" : "Upload image"}
              >
                {uploading ? "..." : "📁"}
              </button>
            </div>
            {!activePath && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Save file first to enable image uploads
              </p>
            )}
          </div>

          {/* SEO Section */}
          <div className="pt-3 mt-3 border-t border-border">
            <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              SEO
            </label>

            {/* Meta Description */}
            {/* TODO: Add "🤖 Improve with AI" button that calls LLM to optimize for SEO */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-500">
                  Meta Description
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const generated = generateMetaDescription(body || "");
                    if (generated) {
                      handleChange("metaDescription", generated);
                    }
                  }}
                  disabled={!body || body.trim().length === 0}
                  className="text-xs px-2 py-0.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Generate from post content"
                >
                  ✨ Generate
                </button>
              </div>
              <textarea
                value={(frontmatter.metaDescription as string) || ""}
                onChange={(e) => handleChange("metaDescription", e.target.value)}
                rows={2}
                placeholder={frontmatter.excerpt ? `Uses excerpt: "${(frontmatter.excerpt as string).slice(0, 60)}..."` : "Uses excerpt if empty"}
                className="w-full px-3 py-1.5 text-sm border border-border rounded bg-background resize-none placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">
                  For search results. ~155 chars recommended.
                </p>
                <p className="text-xs text-muted-foreground">
                  {((frontmatter.metaDescription as string) || "").length}/155
                </p>
              </div>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}
