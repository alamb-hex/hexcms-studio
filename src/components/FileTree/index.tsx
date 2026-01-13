"use client";

import { useState } from "react";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

interface FileTreeProps {
  tree: FileNode[];
  onFileSelect: (path: string) => void;
  selectedPath?: string | null;
}

function FileTreeNode({
  node,
  onFileSelect,
  selectedPath,
  depth = 0,
}: {
  node: FileNode;
  onFileSelect: (path: string) => void;
  selectedPath?: string | null;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const isSelected = node.path === selectedPath;
  const isMarkdown = node.type === "file" && /\.(md|mdx)$/i.test(node.name);

  if (node.type === "directory") {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center gap-1 w-full px-2 py-1 text-left text-sm hover:bg-muted rounded text-foreground`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <span className="text-muted-foreground">{expanded ? "▼" : "▶"}</span>
          <span className="text-yellow-600">📁</span>
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                onFileSelect={onFileSelect}
                selectedPath={selectedPath}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => onFileSelect(node.path)}
      className={`flex items-center gap-1 w-full px-2 py-1 text-left text-sm rounded truncate ${
        isSelected
          ? "bg-accent/20 text-accent"
          : "hover:bg-muted text-foreground"
      }`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
    >
      <span>{isMarkdown ? "📝" : "📄"}</span>
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileTree({ tree, onFileSelect, selectedPath }: FileTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        No content files found. Add a repository first.
      </div>
    );
  }

  return (
    <div className="py-2">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          onFileSelect={onFileSelect}
          selectedPath={selectedPath}
        />
      ))}
    </div>
  );
}
