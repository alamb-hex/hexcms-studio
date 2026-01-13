"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback, useState, useRef } from "react";
import TurndownService from "turndown";

interface VisualEditorProps {
  content: string; // Markdown content
  onChange: (markdown: string) => void;
  onSave?: () => void;
  className?: string;
  activePath?: string; // Path to the current markdown file (for image uploads)
}

// Configure Turndown for markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Custom rule for images - TipTap outputs <img> tags that need explicit handling
// Uses data-markdown-src for local uploads (relative paths) or falls back to src
turndownService.addRule("images", {
  filter: "img",
  replacement: function (content, node) {
    const img = node as HTMLImageElement;
    const alt = img.alt || "";
    // Prefer markdown-specific path (relative), fall back to src (API or URL)
    const markdownSrc = img.getAttribute("data-markdown-src");
    const src = markdownSrc || img.getAttribute("src") || "";
    const title = img.title ? ` "${img.title}"` : "";
    return src ? `![${alt}](${src}${title})` : "";
  },
});

// Convert markdown to HTML (simple version for loading)
// activePath is used to convert relative image paths to API paths for display
function markdownToHtml(markdown: string, activePath?: string): string {
  // This is a simplified converter - the full preview API handles complex cases
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/__(.*?)__/gim, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/_(.*?)_/gim, "<em>$1</em>")
    // Code
    .replace(/`([^`]+)`/gim, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>')
    // Images - handle relative paths by converting to API paths for display
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, (match, alt, src) => {
      // For relative paths (./images/...), convert to API path for display
      // but preserve original in data-markdown-src for saving
      if (src.startsWith("./") && activePath) {
        const mdDir = activePath.replace(/[^/]+$/, ""); // Get directory
        const apiPath = `/api/images/${mdDir}${src.slice(2)}`; // Remove ./ prefix
        return `<img src="${apiPath}" alt="${alt}" data-markdown-src="${src}" />`;
      }
      // External URLs or already-converted paths - use as-is
      return `<img src="${src}" alt="${alt}" />`;
    })
    // Line breaks
    .replace(/\n\n/gim, "</p><p>")
    .replace(/\n/gim, "<br>");

  // Wrap in paragraphs
  if (html && !html.startsWith("<")) {
    html = `<p>${html}</p>`;
  }

  return html;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 text-sm rounded transition-colors ${
        active
          ? "bg-accent/20 text-accent"
          : "hover:bg-background text-muted-foreground"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

export function VisualEditor({
  content,
  onChange,
  onSave,
  className = "",
  activePath,
}: VisualEditorProps) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            // Store the markdown path separately from the display src
            "data-markdown-src": {
              default: null,
              parseHTML: (element) => element.getAttribute("data-markdown-src"),
              renderHTML: (attributes) => {
                if (!attributes["data-markdown-src"]) return {};
                return { "data-markdown-src": attributes["data-markdown-src"] };
              },
            },
          };
        },
      }).configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: markdownToHtml(content, activePath),
    editorProps: {
      attributes: {
        class:
          "prose prose-zinc dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none",
      },
      handleKeyDown: (view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === "s") {
          event.preventDefault();
          onSave?.();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
  });

  // Update content when it changes externally
  useEffect(() => {
    if (editor && content) {
      const currentHtml = editor.getHTML();
      const newHtml = markdownToHtml(content, activePath);
      // Only update if significantly different (avoid cursor jumps)
      if (
        turndownService.turndown(currentHtml).trim() !==
        content.trim()
      ) {
        editor.commands.setContent(newHtml);
      }
    }
  }, [content, editor, activePath]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!editor || !activePath) return;

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
      // Set both display src (API path) and markdown src (relative path)
      editor.chain().focus().setImage({
        src: data.path,
        "data-markdown-src": data.markdownPath
      }).run();
      setShowImageModal(false);
      setImageUrl("");
    } catch (error) {
      console.error("Upload error:", error);
      alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [editor, activePath]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const addImageFromUrl = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setShowImageModal(false);
    setImageUrl("");
  }, [editor, imageUrl]);

  const openImageModal = useCallback(() => {
    setShowImageModal(true);
  }, []);

  if (!editor) {
    return <div className="p-4 text-muted-foreground">Loading editor...</div>;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border bg-muted flex-wrap">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Inline Code"
        >
          {"</>"}
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive("heading", { level: 1 })}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
        >
          H3
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Bullet List"
        >
          • List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Numbered List"
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Quote"
        >
          &ldquo; Quote
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Insert */}
        <ToolbarButton onClick={addLink} title="Add Link">
          Link
        </ToolbarButton>
        <ToolbarButton onClick={openImageModal} title="Add Image">
          Image
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Code Block"
        >
          Code Block
        </ToolbarButton>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          Undo
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          Redo
        </ToolbarButton>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto bg-background">
        <EditorContent editor={editor} className="h-full" />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Image upload modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>

            {/* File upload option */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Upload from computer
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !activePath}
                className="w-full px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  "Uploading..."
                ) : !activePath ? (
                  "Save file first to enable uploads"
                ) : (
                  <>
                    <span className="block text-2xl mb-1">📁</span>
                    <span className="text-sm text-muted-foreground">
                      Click to browse files
                    </span>
                  </>
                )}
              </button>
              {activePath && (
                <p className="text-xs text-muted-foreground mt-1">
                  Image will be saved to: {activePath.replace(/[^/]+$/, "")}images/
                </p>
              )}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-sm text-muted-foreground">
                  or
                </span>
              </div>
            </div>

            {/* URL option */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Image URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-border rounded bg-background"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowImageModal(false);
                  setImageUrl("");
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={addImageFromUrl}
                disabled={!imageUrl}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Insert URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
