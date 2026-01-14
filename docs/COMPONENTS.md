# HexCMS Studio Components

This document describes the component architecture and usage patterns in HexCMS Studio.

## Component Overview

```
src/components/
├── Editor/             # Raw markdown code editor
├── FrontmatterForm/    # Metadata form editor
├── GitPanel/           # Git operations sidebar
├── Preview/            # Live markdown preview
├── Sidebar/            # File tree navigation
├── ThemeToggle/        # Theme selection dropdown
└── VisualEditor/       # WYSIWYG editor
```

## Editor

**Path**: `src/components/Editor/index.tsx`

A CodeMirror 6-based markdown editor with syntax highlighting and keyboard shortcuts.

### Props

```tsx
interface EditorProps {
  content: string;          // Current markdown content
  onChange: (content: string) => void;  // Content change handler
  onSave?: () => void;      // Ctrl+S handler
  className?: string;       // Additional CSS classes
}
```

### Features

- Line numbers
- Active line highlighting
- Markdown syntax highlighting
- History (undo/redo)
- Keyboard shortcut: `Cmd/Ctrl+S` to save
- Dark theme support via `oneDark`

### Usage

```tsx
<Editor
  content={markdownContent}
  onChange={setMarkdownContent}
  onSave={handleSave}
/>
```

## VisualEditor

**Path**: `src/components/VisualEditor/index.tsx`

A TipTap-based WYSIWYG editor with formatting toolbar.

### Props

```tsx
interface VisualEditorProps {
  content: string;          // HTML content
  onChange: (content: string) => void;
  onSave?: () => void;
  className?: string;
}
```

### Toolbar Features

| Button | Action |
|--------|--------|
| **B** | Bold |
| *I* | Italic |
| ~~S~~ | Strikethrough |
| `</>` | Inline code |
| H1-H3 | Headings |
| • List | Bullet list |
| 1. List | Numbered list |
| " Quote | Blockquote |
| Link | Insert/edit link |
| Image | Insert image (upload or URL) |
| YouTube | Embed YouTube video (URL dialog) |
| Code Block | Code block |
| Undo/Redo | History navigation |

### TipTap Extensions Used

- StarterKit (basic formatting)
- Link (with auto-linking)
- Image
- Placeholder

## Preview

**Path**: `src/components/Preview/index.tsx`

Renders markdown content as sanitized HTML with typography styling.

### Props

```tsx
interface PreviewProps {
  content: string;    // Raw markdown content
  className?: string;
}
```

### Security

Uses DOMPurify to sanitize rendered HTML:

```tsx
const sanitizedHtml = DOMPurify.sanitize(data.html, {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["target", "rel"],
});
```

### Styling

Applies Tailwind Typography classes:
- `prose` - Base typography
- `prose-zinc` - Zinc color scheme
- `dark:prose-invert` - Dark mode support
- `max-w-none` - Full width

### Debouncing

Preview rendering is debounced by 300ms to prevent excessive API calls.

## FrontmatterForm

**Path**: `src/components/FrontmatterForm/index.tsx`

A form interface for editing YAML frontmatter metadata.

### Props

```tsx
interface FrontmatterFormProps {
  frontmatter: Frontmatter;
  onChange: (frontmatter: Frontmatter) => void;
  onGenerateDescription?: () => void;
}

interface Frontmatter {
  title?: string;
  author?: string;
  publishedAt?: string;
  status?: "draft" | "published" | "archived";
  featured?: boolean;
  excerpt?: string;
  tags?: string[];
  featuredImage?: string;
  seo?: {
    metaDescription?: string;
  };
}
```

### Form Fields

| Field | Type | Description |
|-------|------|-------------|
| Title | Text input | Post title |
| Author | Text input | Author name |
| Published At | Date input | Publication date |
| Status | Select | draft/published/archived |
| Featured | Checkbox | Featured post flag |
| Excerpt | Textarea | Short description |
| Tags | Text input | Comma-separated tags |
| Featured Image | Text input + browse | Image path |
| Meta Description | Textarea | SEO description |

### Features

- Collapsible panel
- Character count for SEO description
- AI-powered description generation button

## Sidebar

**Path**: `src/components/Sidebar/index.tsx`

File tree browser with folder expansion and file selection.

### Props

```tsx
interface SidebarProps {
  files: FileNode[];
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onCollapse?: () => void;
  repoName?: string;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}
```

### Features

- Collapsible sidebar
- Folder expansion/collapse
- File type icons (📝 for markdown, 📄 for other files)
- Active file highlighting
- Repository name display
- Footer branding with Hexaxia Technologies logo and GitHub link

## GitPanel

**Path**: `src/components/GitPanel/index.tsx`

Git operations sidebar panel for version control.

### Props

```tsx
interface GitPanelProps {
  onClose: () => void;
}
```

### Features

- **Status Display**: Current branch, ahead/behind counts
- **Change Lists**: Staged, modified, untracked, deleted files
- **Commit Form**: Textarea for commit message
- **Actions**: Stage All, Commit, Pull, Push

### API Integration

Communicates with `/api/git` endpoint:

```tsx
// Fetch status
await fetch("/api/git?action=status");

// Stage all files
await fetch("/api/git", {
  method: "POST",
  body: JSON.stringify({ action: "stage-all" }),
});

// Commit
await fetch("/api/git", {
  method: "POST",
  body: JSON.stringify({ action: "commit", message: "..." }),
});

// Push/Pull
await fetch("/api/git", {
  method: "POST",
  body: JSON.stringify({ action: "push" }),  // or "pull"
});
```

## ThemeToggle

**Path**: `src/components/ThemeToggle/index.tsx`

Dropdown component for theme selection.

### Features

- Current theme display with icon
- Dropdown menu with all theme options
- Checkmark indicator for active theme
- LocalStorage persistence
- System preference detection

### Theme Options

| Theme | Icon | Description |
|-------|------|-------------|
| Light | ☀️ | Default light theme |
| Dark | 🌙 | Standard dark theme |
| Midnight | 🌌 | Deep blue dark theme |
| Sepia | 📜 | Warm paper-like theme |
| System | 💻 | Follow OS preference |

### State Management

```tsx
const [theme, setTheme] = useState<string>("system");

useEffect(() => {
  // Load from localStorage
  const saved = localStorage.getItem("hexcms-theme");
  if (saved) setTheme(saved);
}, []);

const handleThemeChange = (newTheme: string) => {
  setTheme(newTheme);
  localStorage.setItem("hexcms-theme", newTheme);

  if (newTheme === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", newTheme);
  }
};
```

## Styling Guidelines

### Theme-Aware Classes

Always use semantic color classes:

```tsx
// Good
<div className="bg-background text-foreground border-border">

// Avoid
<div className="bg-white text-black border-gray-200 dark:bg-gray-900">
```

### Common Patterns

```tsx
// Panel/Card
<div className="bg-muted border border-border rounded-lg p-4">

// Button (Primary)
<button className="bg-accent text-accent-foreground hover:bg-accent/90 px-4 py-2 rounded">

// Button (Secondary)
<button className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded">

// Input
<input className="bg-background border border-border rounded px-3 py-2 text-foreground" />

// Muted text
<p className="text-muted-foreground text-sm">Helper text</p>
```

## State Management

Components use React's built-in state management:

- `useState` for local component state
- `useEffect` for side effects and data fetching
- `useCallback` for memoized callbacks
- `useRef` for editor instance references

### Data Flow

```
page.tsx (Main State)
    ├── content: string
    ├── frontmatter: Frontmatter
    ├── selectedFile: string
    └── files: FileNode[]
         │
         ├── Sidebar (onSelectFile)
         ├── FrontmatterForm (onChange)
         ├── Editor/VisualEditor (onChange)
         └── Preview (content)
```
