"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { FileTree } from "@/components/FileTree";
import { FileBrowser } from "@/components/FileBrowser";
import { Editor } from "@/components/Editor";
import { Preview } from "@/components/Preview";
import { GitPanel } from "@/components/GitPanel";
import { FrontmatterForm } from "@/components/FrontmatterForm";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

// Dynamic import for VisualEditor to avoid SSR issues with Tiptap
const VisualEditor = dynamic(
  () => import("@/components/VisualEditor").then((mod) => mod.VisualEditor),
  { ssr: false, loading: () => <div className="p-4">Loading editor...</div> }
);

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface Repo {
  id: string;
  name: string;
  path: string;
  contentPath: string;
}

interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
}

// Client-side markdown parsing (simple version)
function parseMarkdownClient(content: string): ParsedMarkdown {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterStr = match[1];
  const body = match[2];

  // Simple YAML parsing
  const frontmatter: Record<string, unknown> = {};
  const lines = frontmatterStr.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: unknown = line.slice(colonIndex + 1).trim();

      // Remove quotes
      if (
        (value as string).startsWith('"') &&
        (value as string).endsWith('"')
      ) {
        value = (value as string).slice(1, -1);
      }

      // Parse arrays
      if ((value as string).startsWith("[") && (value as string).endsWith("]")) {
        const arrayStr = (value as string).slice(1, -1);
        value = arrayStr
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter((s) => s.length > 0);
      }

      // Parse booleans
      if (value === "true") value = true;
      if (value === "false") value = false;

      frontmatter[key] = value;
    }
  }

  return { frontmatter, body };
}

function serializeMarkdownClient(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  const lines: string[] = ["---"];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => `"${v}"`).join(", ")}]`);
    } else if (typeof value === "string") {
      lines.push(`${key}: "${value}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push("---");
  lines.push(body);

  return lines.join("\n");
}

// Default frontmatter for new posts
function getDefaultFrontmatter(): Record<string, unknown> {
  return {
    title: "Untitled Post",
    author: "",
    publishedAt: new Date().toISOString().split("T")[0],
    excerpt: "",
    featuredImage: "",
    status: "draft",
    featured: false,
    tags: [],
  };
}

export default function Home() {
  // App mode: "blog" for repository-based blog editing, "file" for general filesystem browsing
  const [appMode, setAppMode] = useState<"blog" | "file">("blog");

  // State
  const [repos, setRepos] = useState<Repo[]>([]);
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [frontmatter, setFrontmatter] = useState<Record<string, unknown>>({});
  const [body, setBody] = useState<string>("");
  const [gitPanelOpen, setGitPanelOpen] = useState(false);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showNewFile, setShowNewFile] = useState(false);
  const [newRepoPath, setNewRepoPath] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoContentPath, setNewRepoContentPath] = useState("");
  const [showPathBrowser, setShowPathBrowser] = useState(false);
  const [browsePath, setBrowsePath] = useState("");
  const [browseItems, setBrowseItems] = useState<{ name: string; path: string; type: string }[]>([]);
  const [newFileName, setNewFileName] = useState("");
  const [newFileTitle, setNewFileTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<"code" | "visual">("visual");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  // Load repos on mount
  useEffect(() => {
    fetchRepos();
  }, []);

  // Load file tree when active repo changes
  useEffect(() => {
    if (activeRepoId) {
      fetchFileTree();
    } else {
      setFileTree([]);
    }
  }, [activeRepoId]);

  const fetchRepos = async () => {
    try {
      const response = await fetch("/api/repos");
      const data = await response.json();
      setRepos(data.repos || []);
      setActiveRepoId(data.activeRepoId);
    } catch (err) {
      console.error("Failed to fetch repos:", err);
    }
  };

  const fetchFileTree = async () => {
    try {
      const response = await fetch("/api/files");
      const data = await response.json();
      setFileTree(data.tree || []);
    } catch (err) {
      console.error("Failed to fetch file tree:", err);
    }
  };

  const handleAddRepo = async () => {
    if (!newRepoPath || !newRepoName) {
      setError("Name and path are required");
      return;
    }

    try {
      const response = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRepoName,
          path: newRepoPath,
          contentPath: newRepoContentPath || "", // Empty string means use repo root
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add repo");
      }

      setNewRepoPath("");
      setNewRepoName("");
      setNewRepoContentPath("");
      setShowAddRepo(false);
      await fetchRepos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add repo");
    }
  };

  const handleDeleteRepo = async (repoId: string) => {
    const repo = repos.find((r) => r.id === repoId);
    if (!repo) return;

    if (!confirm(`Remove "${repo.name}" from HexCMS Studio?\n\nThis will NOT delete any files from your filesystem.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/repos?id=${repoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove repo");
      }

      await fetchRepos();
      // Clear active file if it was from the deleted repo
      if (activeRepoId === repoId) {
        setActiveFile(null);
        setContent("");
        setFileTree([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove repo");
    }
  };

  const openPathBrowser = async (startPath?: string) => {
    // If startPath is provided and non-empty, use it; otherwise get home directory from API
    const pathToOpen = startPath && startPath.trim() ? startPath : "";
    try {
      // API defaults to home directory if no path specified
      const url = pathToOpen
        ? `/api/filesystem?path=${encodeURIComponent(pathToOpen)}`
        : `/api/filesystem`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.items) {
        setBrowsePath(data.path);
        setBrowseItems(data.items.filter((item: { type: string }) => item.type === "directory"));
        setShowPathBrowser(true);
      }
    } catch (err) {
      console.error("Failed to browse:", err);
    }
  };

  const navigateBrowser = async (path: string) => {
    try {
      const response = await fetch(`/api/filesystem?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      if (data.items) {
        setBrowsePath(data.path);
        setBrowseItems(data.items.filter((item: { type: string }) => item.type === "directory"));
      }
    } catch (err) {
      console.error("Failed to navigate:", err);
    }
  };

  const selectBrowsePath = () => {
    setNewRepoPath(browsePath);
    setShowPathBrowser(false);
  };

  const handleCreateFile = async () => {
    if (!newFileName) {
      setError("File name is required");
      return;
    }

    // Ensure .md extension
    let fileName = newFileName;
    if (!fileName.endsWith(".md") && !fileName.endsWith(".mdx")) {
      fileName += ".md";
    }

    // Create file path (use blog folder with date structure)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const slug = fileName.replace(/\.mdx?$/, "");
    const filePath = `blog/${year}/${month}/${slug}/${fileName}`;

    // Create frontmatter with title
    const fm = {
      ...getDefaultFrontmatter(),
      title: newFileTitle || "Untitled Post",
    };
    const fileContent = serializeMarkdownClient(fm, "\n\nStart writing here...\n");

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: filePath, content: fileContent }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create file");
      }

      setNewFileName("");
      setNewFileTitle("");
      setShowNewFile(false);
      await fetchFileTree();

      // Open the new file
      await handleFileSelect(filePath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create file");
    }
  };

  const handleSelectRepo = async (id: string) => {
    try {
      await fetch("/api/repos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeRepoId: id }),
      });
      setActiveRepoId(id);
      setActiveFile(null);
      setContent("");
    } catch (err) {
      console.error("Failed to select repo:", err);
    }
  };

  const handleFileSelect = async (path: string) => {
    if (!path.endsWith(".md") && !path.endsWith(".mdx")) {
      return; // Only open markdown files
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/files?path=${encodeURIComponent(path)}`
      );
      if (!response.ok) throw new Error("Failed to load file");
      const data = await response.json();

      setActiveFile(path);
      setContent(data.content);
      setOriginalContent(data.content);

      // Parse frontmatter
      const parsed = parseMarkdownClient(data.content);
      setFrontmatter(parsed.frontmatter);
      setBody(parsed.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (newBody: string) => {
    setBody(newBody);
    if (appMode === "file") {
      // In file mode, content is the raw body (no frontmatter serialization)
      setContent(newBody);
    } else {
      // In blog mode, serialize frontmatter + body
      const newContent = serializeMarkdownClient(frontmatter, newBody);
      setContent(newContent);
    }
  };

  const handleFrontmatterChange = (newFrontmatter: Record<string, unknown>) => {
    setFrontmatter(newFrontmatter);
    const newContent = serializeMarkdownClient(newFrontmatter, body);
    setContent(newContent);
  };

  // Handler for file mode file selection
  const handleFileModeSelect = (path: string, fileContent: string) => {
    setActiveFile(path);
    setContent(fileContent);
    setOriginalContent(fileContent);
    // In file mode, we don't parse frontmatter - just use raw content as body
    setFrontmatter({});
    setBody(fileContent);
  };

  // Handler for switching app modes
  const handleModeSwitch = (mode: "blog" | "file") => {
    if (mode === appMode) return;
    // Clear file state when switching modes
    setActiveFile(null);
    setContent("");
    setOriginalContent("");
    setFrontmatter({});
    setBody("");
    setAppMode(mode);
  };

  const handleSave = async () => {
    if (!activeFile) return;

    setSaving(true);
    setError(null);
    try {
      // Use different API based on mode
      const apiEndpoint = appMode === "file" ? "/api/filesystem" : "/api/files";
      const response = await fetch(apiEndpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: activeFile, content }),
      });

      if (!response.ok) throw new Error("Failed to save file");
      setOriginalContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const isDirty = content !== originalContent;
  const activeRepo = repos.find((r) => r.id === activeRepoId);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 border-b border-border bg-background">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold">HexCMS Studio</h1>

          {/* App Mode Switcher */}
          <div className="flex items-center bg-muted rounded p-0.5">
            <button
              onClick={() => handleModeSwitch("blog")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                appMode === "blog"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              📝 Blog
            </button>
            <button
              onClick={() => handleModeSwitch("file")}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                appMode === "file"
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              📁 Files
            </button>
          </div>

          {/* Blog mode specific controls */}
          {appMode === "blog" && (
            <>
              {/* Repo selector */}
              <select
                value={activeRepoId || ""}
                onChange={(e) =>
                  e.target.value && handleSelectRepo(e.target.value)
                }
                className="px-2 py-1 text-sm border border-border rounded bg-background"
              >
                <option value="">Select repository...</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.id}>
                    {repo.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowAddRepo(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                + Add Repo
              </button>

              {activeRepoId && (
                <button
                  onClick={() => handleDeleteRepo(activeRepoId)}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  title="Remove repository from HexCMS (does not delete files)"
                >
                  Remove Repo
                </button>
              )}

              {activeRepo && (
                <button
                  onClick={() => setShowNewFile(true)}
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400"
                >
                  + New Post
                </button>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Editor mode toggle */}
          {activeFile && (
            <div className="flex items-center bg-muted rounded p-0.5">
              <button
                onClick={() => setEditorMode("visual")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  editorMode === "visual"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Visual
              </button>
              <button
                onClick={() => setEditorMode("code")}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  editorMode === "code"
                    ? "bg-background shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Code
              </button>
            </div>
          )}

          {activeFile && (
            <>
              <span className="text-sm text-muted-foreground font-mono truncate max-w-[200px]">
                {activeFile}
                {isDirty && <span className="text-orange-500 ml-1">●</span>}
              </span>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="px-3 py-1 text-sm bg-accent text-accent-foreground rounded hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}
          {appMode === "blog" && (
            <button
              onClick={() => setGitPanelOpen(!gitPanelOpen)}
              className={`px-3 py-1 text-sm rounded ${
                gitPanelOpen
                  ? "bg-muted"
                  : "bg-muted hover:opacity-80"
              }`}
            >
              Git
            </button>
          )}
          <ThemeSwitcher />
        </div>
      </header>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 text-red-600 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - File tree */}
        <aside className={`border-r border-border bg-background transition-all duration-200 flex flex-col ${sidebarCollapsed ? "w-10" : "w-64"}`}>
          {/* Sidebar header with collapse toggle */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-border">
            {!sidebarCollapsed && (
              <span className="text-xs font-semibold text-muted-foreground uppercase truncate">
                {appMode === "file" ? "File Browser" : activeRepo?.name || "Files"}
              </span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-muted rounded text-muted-foreground"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>

          {/* Sidebar content */}
          {!sidebarCollapsed && (
            <div className="flex-1 overflow-auto">
              {appMode === "file" ? (
                <FileBrowser
                  onFileSelect={handleFileModeSelect}
                  selectedPath={activeFile}
                />
              ) : activeRepo ? (
                <FileTree
                  tree={fileTree}
                  onFileSelect={handleFileSelect}
                  selectedPath={activeFile}
                />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  Select or add a repository to get started.
                </div>
              )}
            </div>
          )}

          {/* Sidebar footer - branding */}
          {!sidebarCollapsed && (
            <div className="mt-auto border-t border-border p-3">
              <div className="flex flex-col gap-2">
                <a
                  href="https://hexaxia.tech"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="Hexaxia Technologies"
                >
                  <img
                    src="/hexaxia-technologies-logo.webp"
                    alt="Hexaxia Technologies"
                    className="h-6 w-auto"
                  />
                </a>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <a
                    href="https://github.com/alamb-hex/hexcms-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                  <span className="opacity-60">v0.1.0</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Editor area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-background">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Loading...
            </div>
          ) : activeFile ? (
            <>
              {/* Frontmatter form - only in blog mode */}
              {appMode === "blog" && (
                <FrontmatterForm
                  frontmatter={frontmatter}
                  onChange={handleFrontmatterChange}
                  activePath={activeFile || undefined}
                  body={body}
                />
              )}

              {/* Editor based on mode */}
              {editorMode === "visual" ? (
                /* Visual mode: WYSIWYG editor with side preview */
                <div className="flex-1 flex overflow-hidden">
                  <div className={`transition-all duration-200 border-r border-border ${previewCollapsed ? "flex-1" : "w-1/2"}`}>
                    <VisualEditor
                      content={body}
                      onChange={handleContentChange}
                      onSave={handleSave}
                      activePath={activeFile || undefined}
                    />
                  </div>
                  {/* Preview panel with collapse toggle */}
                  <div className={`transition-all duration-200 bg-background flex flex-col ${previewCollapsed ? "w-10" : "w-1/2"}`}>
                    <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted">
                      <button
                        onClick={() => setPreviewCollapsed(!previewCollapsed)}
                        className="p-1 hover:bg-background rounded text-muted-foreground"
                        title={previewCollapsed ? "Show preview" : "Hide preview"}
                      >
                        {previewCollapsed ? "◀" : "▶"}
                      </button>
                      {!previewCollapsed && (
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Preview</span>
                      )}
                    </div>
                    {!previewCollapsed && (
                      <div className="flex-1 overflow-auto">
                        <Preview content={content} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Code mode: Markdown editor with preview */
                <div className="flex-1 flex overflow-hidden">
                  <div className={`transition-all duration-200 border-r border-border ${previewCollapsed ? "flex-1" : "w-1/2"}`}>
                    <Editor
                      content={body}
                      onChange={handleContentChange}
                      onSave={handleSave}
                    />
                  </div>
                  {/* Preview panel with collapse toggle */}
                  <div className={`transition-all duration-200 bg-background flex flex-col ${previewCollapsed ? "w-10" : "w-1/2"}`}>
                    <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted">
                      <button
                        onClick={() => setPreviewCollapsed(!previewCollapsed)}
                        className="p-1 hover:bg-background rounded text-muted-foreground"
                        title={previewCollapsed ? "Show preview" : "Hide preview"}
                      >
                        {previewCollapsed ? "◀" : "▶"}
                      </button>
                      {!previewCollapsed && (
                        <span className="text-xs font-semibold text-muted-foreground uppercase">Preview</span>
                      )}
                    </div>
                    {!previewCollapsed && (
                      <div className="flex-1 overflow-auto">
                        <Preview content={content} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4">
              {appMode === "file" ? (
                <p>Select a file to edit from the file browser</p>
              ) : (
                <>
                  <p>Select a markdown file to edit</p>
                  {activeRepo && (
                    <button
                      onClick={() => setShowNewFile(true)}
                      className="px-4 py-2 bg-accent text-accent-foreground rounded hover:opacity-90"
                    >
                      Create New Post
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* Git panel - only in blog mode */}
        {gitPanelOpen && appMode === "blog" && (
          <aside className="w-80">
            <GitPanel onClose={() => setGitPanelOpen(false)} />
          </aside>
        )}
      </div>

      {/* Add Repo Modal */}
      {showAddRepo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-[28rem] shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Add Repository</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                  placeholder="My Blog"
                  className="w-full px-3 py-2 border border-border rounded bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Local Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRepoPath}
                    onChange={(e) => setNewRepoPath(e.target.value)}
                    placeholder="/home/user/my-hexcms-site"
                    className="flex-1 px-3 py-2 border border-border rounded bg-background font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => openPathBrowser(newRepoPath || undefined)}
                    className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded"
                  >
                    Browse
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Content Path <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={newRepoContentPath}
                  onChange={(e) => setNewRepoContentPath(e.target.value)}
                  placeholder="content (leave empty to use repo root)"
                  className="w-full px-3 py-2 border border-border rounded bg-background font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Subdirectory containing your markdown files (e.g., &quot;content&quot;, &quot;docs&quot;, &quot;posts&quot;)
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddRepo(false);
                  setNewRepoPath("");
                  setNewRepoName("");
                  setNewRepoContentPath("");
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRepo}
                className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded hover:opacity-90"
              >
                Add Repository
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Path Browser Modal */}
      {showPathBrowser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-background border border-border rounded-lg p-6 w-[32rem] max-h-[80vh] shadow-xl flex flex-col">
            <h2 className="text-lg font-semibold mb-2">Browse for Folder</h2>

            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={browsePath}
                onChange={(e) => setBrowsePath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && navigateBrowser(browsePath)}
                className="flex-1 px-3 py-2 border border-border rounded bg-background font-mono text-sm"
              />
              <button
                onClick={() => navigateBrowser(browsePath)}
                className="px-3 py-2 text-sm bg-muted hover:bg-muted/80 border border-border rounded"
              >
                Go
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-border rounded bg-muted/30 min-h-[200px]">
              {/* Parent directory link */}
              {browsePath !== "/" && (
                <button
                  onClick={() => navigateBrowser(browsePath.split("/").slice(0, -1).join("/") || "/")}
                  className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border"
                >
                  <span>📁</span>
                  <span>..</span>
                </button>
              )}

              {browseItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigateBrowser(item.path)}
                  className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 border-b border-border last:border-b-0"
                >
                  <span>📁</span>
                  <span className="truncate">{item.name}</span>
                </button>
              ))}

              {browseItems.length === 0 && (
                <div className="px-3 py-4 text-muted-foreground text-center">
                  No subdirectories found
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowPathBrowser(false)}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={selectBrowsePath}
                className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded hover:opacity-90"
              >
                Select This Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {showNewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-96 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Create New Post</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newFileTitle}
                  onChange={(e) => setNewFileTitle(e.target.value)}
                  placeholder="My Amazing Post"
                  className="w-full px-3 py-2 border border-border rounded bg-background"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  File Name (slug)
                </label>
                <input
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="my-amazing-post"
                  className="w-full px-3 py-2 border border-border rounded bg-background font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Will be created at: blog/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, "0")}/{newFileName || "slug"}/{newFileName || "slug"}.md
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowNewFile(false);
                  setNewFileName("");
                  setNewFileTitle("");
                }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 text-sm bg-accent text-accent-foreground rounded hover:opacity-90"
              >
                Create Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
