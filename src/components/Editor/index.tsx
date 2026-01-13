"use client";

import { useEffect, useRef, useCallback } from "react";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: () => void;
  className?: string;
}

export function Editor({ content, onChange, onSave, className = "" }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const isUpdatingRef = useRef(false);

  // Create save keymap
  const saveKeymap = keymap.of([
    {
      key: "Mod-s",
      run: () => {
        onSave?.();
        return true;
      },
    },
  ]);

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current) return;

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        markdown(),
        syntaxHighlighting(defaultHighlightStyle),
        ...(isDark ? [oneDark] : []),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingRef.current) {
            onChange(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
          },
          ".cm-scroller": {
            overflow: "auto",
            fontFamily: "var(--font-geist-mono), monospace",
          },
          ".cm-content": {
            padding: "16px 0",
          },
          ".cm-line": {
            padding: "0 16px",
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // Only run once on mount

  // Update content when it changes externally
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== content) {
      isUpdatingRef.current = true;
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: content,
        },
      });
      isUpdatingRef.current = false;
    }
  }, [content]);

  return (
    <div
      ref={editorRef}
      className={`h-full overflow-hidden bg-background ${className}`}
    />
  );
}
