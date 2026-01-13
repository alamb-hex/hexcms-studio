"use client";

import { useState, useEffect, useCallback } from "react";

interface FileItem {
  name: string;
  path: string;
  type: "file" | "directory";
}

interface DirectoryContents {
  path: string;
  parent: string;
  items: FileItem[];
  type: "directory";
}

interface FileBrowserProps {
  onFileSelect: (path: string, content: string) => void;
  selectedPath?: string | null;
  initialPath?: string;
}

export function FileBrowser({
  onFileSelect,
  selectedPath,
  initialPath,
}: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || "");
  const [contents, setContents] = useState<DirectoryContents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  const fetchDirectory = useCallback(async (dirPath?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = dirPath
        ? `/api/filesystem?path=${encodeURIComponent(dirPath)}`
        : "/api/filesystem";
      const response = await fetch(url);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to load directory");
      }
      const data = await response.json();
      setContents(data);
      setCurrentPath(data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load directory");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial directory
  useEffect(() => {
    fetchDirectory(initialPath);
  }, [fetchDirectory, initialPath]);

  const handleNavigate = (path: string) => {
    fetchDirectory(path);
  };

  const handleFileClick = async (item: FileItem) => {
    if (item.type === "directory") {
      handleNavigate(item.path);
    } else {
      // Load file content
      try {
        const response = await fetch(
          `/api/filesystem?path=${encodeURIComponent(item.path)}&action=read`
        );
        if (!response.ok) {
          throw new Error("Failed to read file");
        }
        const data = await response.json();
        onFileSelect(item.path, data.content);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to read file");
      }
    }
  };

  const handleGoUp = () => {
    if (contents?.parent) {
      handleNavigate(contents.parent);
    }
  };

  const getFileIcon = (item: FileItem) => {
    if (item.type === "directory") return "📁";

    const ext = item.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "md":
      case "mdx":
        return "📝";
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
        return "📜";
      case "json":
        return "📋";
      case "css":
      case "scss":
        return "🎨";
      case "html":
        return "🌐";
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
      case "webp":
        return "🖼️";
      case "pdf":
        return "📕";
      default:
        return "📄";
    }
  };

  // Filter items based on showHidden
  const filteredItems = contents?.items.filter((item) => {
    if (showHidden) return true;
    return !item.name.startsWith(".");
  });

  if (loading && !contents) {
    return (
      <div className="p-4 text-sm text-muted-foreground">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-500 mb-2">{error}</div>
        <button
          onClick={() => fetchDirectory()}
          className="text-sm text-accent hover:opacity-80"
        >
          Go to home directory
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Path bar */}
      <div className="px-3 py-2 border-b border-border bg-muted">
        <div className="flex items-center gap-2">
          <button
            onClick={handleGoUp}
            disabled={!contents?.parent || contents.path === contents.parent}
            className="p-1 hover:bg-background rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="Go up"
          >
            ⬆️
          </button>
          <button
            onClick={() => fetchDirectory(currentPath)}
            className="p-1 hover:bg-background rounded"
            title="Refresh"
          >
            🔄
          </button>
          <div className="flex-1 font-mono text-xs text-muted-foreground truncate">
            {currentPath}
          </div>
        </div>
      </div>

      {/* Toggle hidden files */}
      <div className="px-3 py-1 border-b border-border flex items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
            className="rounded"
          />
          Show hidden files
        </label>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-auto py-1">
        {filteredItems?.map((item) => (
          <button
            key={item.path}
            onClick={() => handleFileClick(item)}
            className={`flex items-center gap-2 w-full px-3 py-1.5 text-left text-sm hover:bg-muted text-foreground ${
              item.path === selectedPath
                ? "bg-accent/20 text-accent"
                : ""
            }`}
          >
            <span>{getFileIcon(item)}</span>
            <span className="truncate">{item.name}</span>
          </button>
        ))}
        {filteredItems?.length === 0 && (
          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
            Empty directory
          </div>
        )}
      </div>
    </div>
  );
}
