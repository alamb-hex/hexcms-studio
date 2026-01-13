"use client";

import { create } from "zustand";

export interface EditorFile {
  path: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
}

export interface Repo {
  id: string;
  name: string;
  path: string;
  contentPath: string;
}

interface EditorState {
  // Repos
  repos: Repo[];
  activeRepoId: string | null;

  // Files
  openFiles: EditorFile[];
  activeFilePath: string | null;

  // Git
  gitStatus: {
    staged: string[];
    modified: string[];
    untracked: string[];
  } | null;

  // UI
  sidebarOpen: boolean;
  gitPanelOpen: boolean;

  // Actions
  setRepos: (repos: Repo[]) => void;
  setActiveRepo: (id: string | null) => void;
  openFile: (path: string, content: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  updateFileContent: (path: string, content: string) => void;
  markFileSaved: (path: string) => void;
  setGitStatus: (status: EditorState["gitStatus"]) => void;
  toggleSidebar: () => void;
  toggleGitPanel: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  repos: [],
  activeRepoId: null,
  openFiles: [],
  activeFilePath: null,
  gitStatus: null,
  sidebarOpen: true,
  gitPanelOpen: false,

  // Actions
  setRepos: (repos) => set({ repos }),

  setActiveRepo: (id) => set({ activeRepoId: id }),

  openFile: (path, content) => {
    const { openFiles } = get();
    const existing = openFiles.find((f) => f.path === path);
    if (existing) {
      set({ activeFilePath: path });
      return;
    }
    set({
      openFiles: [
        ...openFiles,
        { path, content, originalContent: content, isDirty: false },
      ],
      activeFilePath: path,
    });
  },

  closeFile: (path) => {
    const { openFiles, activeFilePath } = get();
    const newFiles = openFiles.filter((f) => f.path !== path);
    let newActive = activeFilePath;
    if (activeFilePath === path) {
      newActive = newFiles.length > 0 ? newFiles[newFiles.length - 1].path : null;
    }
    set({ openFiles: newFiles, activeFilePath: newActive });
  },

  setActiveFile: (path) => set({ activeFilePath: path }),

  updateFileContent: (path, content) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === path
          ? { ...f, content, isDirty: content !== f.originalContent }
          : f
      ),
    });
  },

  markFileSaved: (path) => {
    const { openFiles } = get();
    set({
      openFiles: openFiles.map((f) =>
        f.path === path
          ? { ...f, originalContent: f.content, isDirty: false }
          : f
      ),
    });
  },

  setGitStatus: (status) => set({ gitStatus: status }),

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toggleGitPanel: () => set((s) => ({ gitPanelOpen: !s.gitPanelOpen })),
}));
