"use client";

import { useState, useEffect, useCallback } from "react";

interface GitStatus {
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  deleted: string[];
  untracked: string[];
}

interface GitPanelProps {
  onClose: () => void;
}

export function GitPanel({ onClose }: GitPanelProps) {
  const [status, setStatus] = useState<GitStatus | null>(null);
  const [commitMessage, setCommitMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/git?action=status");
      if (!response.ok) throw new Error("Failed to fetch git status");
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleStageAll = async () => {
    setActionLoading("stage");
    try {
      const response = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stage-all" }),
      });
      if (!response.ok) throw new Error("Failed to stage files");
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stage files");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError("Commit message is required");
      return;
    }
    setActionLoading("commit");
    try {
      const response = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "commit", message: commitMessage }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to commit");
      }
      setCommitMessage("");
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to commit");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePush = async () => {
    setActionLoading("push");
    try {
      const response = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "push" }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to push");
      }
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to push");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePull = async () => {
    setActionLoading("pull");
    try {
      const response = await fetch("/api/git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pull" }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to pull");
      }
      await fetchStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to pull");
    } finally {
      setActionLoading(null);
    }
  };

  const totalChanges =
    (status?.staged.length || 0) +
    (status?.modified.length || 0) +
    (status?.untracked.length || 0) +
    (status?.deleted.length || 0);

  return (
    <div className="h-full flex flex-col bg-background border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold">Git</h2>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      {/* Branch info */}
      {status && (
        <div className="px-4 py-2 text-sm border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Branch:</span>
            <span className="font-mono">{status.current}</span>
          </div>
          {(status.ahead > 0 || status.behind > 0) && (
            <div className="text-xs text-muted-foreground mt-1">
              {status.ahead > 0 && <span className="text-green-600">↑{status.ahead}</span>}
              {status.behind > 0 && <span className="text-orange-600 ml-2">↓{status.behind}</span>}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="px-4 py-8 text-center text-muted-foreground">Loading...</div>
      )}

      {/* Changes */}
      {status && !loading && (
        <div className="flex-1 overflow-auto">
          {/* Staged */}
          {status.staged.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-green-600 mb-1">
                Staged ({status.staged.length})
              </div>
              {status.staged.map((file) => (
                <div key={file} className="text-sm font-mono truncate text-green-600">
                  {file}
                </div>
              ))}
            </div>
          )}

          {/* Modified */}
          {status.modified.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-orange-600 mb-1">
                Modified ({status.modified.length})
              </div>
              {status.modified.map((file) => (
                <div key={file} className="text-sm font-mono truncate text-orange-600">
                  {file}
                </div>
              ))}
            </div>
          )}

          {/* Untracked */}
          {status.untracked.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                Untracked ({status.untracked.length})
              </div>
              {status.untracked.map((file) => (
                <div key={file} className="text-sm font-mono truncate text-muted-foreground">
                  {file}
                </div>
              ))}
            </div>
          )}

          {/* Deleted */}
          {status.deleted.length > 0 && (
            <div className="px-4 py-2">
              <div className="text-xs font-semibold text-red-600 mb-1">
                Deleted ({status.deleted.length})
              </div>
              {status.deleted.map((file) => (
                <div key={file} className="text-sm font-mono truncate text-red-600">
                  {file}
                </div>
              ))}
            </div>
          )}

          {totalChanges === 0 && (
            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
              No changes
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="border-t border-border p-4 space-y-3">
        {/* Commit message */}
        <textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          className="w-full px-3 py-2 text-sm border border-border rounded bg-background resize-none"
          rows={2}
        />

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleStageAll}
            disabled={actionLoading !== null}
            className="flex-1 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded disabled:opacity-50"
          >
            {actionLoading === "stage" ? "..." : "Stage All"}
          </button>
          <button
            onClick={handleCommit}
            disabled={actionLoading !== null || !commitMessage.trim()}
            className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded disabled:opacity-50"
          >
            {actionLoading === "commit" ? "..." : "Commit"}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePull}
            disabled={actionLoading !== null}
            className="flex-1 px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 rounded disabled:opacity-50"
          >
            {actionLoading === "pull" ? "..." : "Pull"}
          </button>
          <button
            onClick={handlePush}
            disabled={actionLoading !== null}
            className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded disabled:opacity-50"
          >
            {actionLoading === "push" ? "..." : "Push"}
          </button>
        </div>
      </div>
    </div>
  );
}
