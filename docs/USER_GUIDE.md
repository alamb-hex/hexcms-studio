# HexCMS Studio User Guide

Welcome to HexCMS Studio! This guide will help you get started with creating and managing your markdown content.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Managing Repositories](#managing-repositories)
4. [Working with Files](#working-with-files)
5. [Creating New Posts](#creating-new-posts)
6. [Editing Content](#editing-content)
7. [Using the Visual Editor](#using-the-visual-editor)
8. [Using the Code Editor](#using-the-code-editor)
9. [Managing Frontmatter](#managing-frontmatter)
10. [Previewing Content](#previewing-content)
11. [Git Operations](#git-operations)
12. [Themes](#themes)
13. [Keyboard Shortcuts](#keyboard-shortcuts)
14. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Launch

1. Open HexCMS Studio in your browser (default: `http://localhost:3000`)
2. You'll see the main interface with a sidebar and content area
3. If no repository is connected, click **+ Add Repo** to add your first content repository

### Requirements

- A Git repository containing markdown files
- The repository should be accessible on your local filesystem

---

## Interface Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  HexCMS Studio  │ Blog │ Files │ [Repo ▼] │ + Add │ + New Post │
├─────────────────┼───────────────────────────────────────────────┤
│                 │ Visual │ Code │      filename.md      │ Save │
│   SIDEBAR       ├─────────────────────────────────────────────────┤
│                 │ Frontmatter ▼                                  │
│   File Tree     │  Title: [ ... ]                                │
│                 │  Author: [ ... ]  Published: [ ... ]           │
│   - authors/    │  ...                                           │
│   - blog/       ├─────────────────────────────────────────────────┤
│   - gallery/    │                    │                           │
│                 │   EDITOR           │   PREVIEW                 │
│                 │                    │                           │
│                 │   Your content     │   Rendered view           │
│                 │   here...          │   of your content         │
│                 │                    │                           │
└─────────────────┴────────────────────┴───────────────────────────┘
```

### Main Areas

| Area | Description |
|------|-------------|
| **Header** | Navigation, repository selector, and actions |
| **Sidebar** | File tree browser for your content |
| **Frontmatter Panel** | Edit post metadata (title, author, tags, etc.) |
| **Editor** | Write your content (Visual or Code mode) |
| **Preview** | See how your content will look |

---

## Managing Repositories

### Adding a Repository

1. Click **+ Add Repo** in the header
2. Enter the repository details:
   - **Name**: A display name for the repository
   - **Path**: The full path to the repository on your system
     - Click **Browse** to open a folder browser and navigate to your repository
   - **Content Path** (optional): Subdirectory containing your markdown files
     - Examples: `content`, `docs`, `posts`, `blog`
     - Leave empty to use the repository root
3. Click **Add Repository** to connect

### Removing a Repository

1. Select the repository you want to remove from the dropdown
2. Click **Remove Repo** (red text in header)
3. Confirm the removal in the dialog

> **Note**: Removing a repository only disconnects it from HexCMS Studio. Your files remain untouched on your filesystem.

### Switching Repositories

- Use the dropdown menu in the header to switch between connected repositories
- The file tree will update to show the selected repository's content

### Repository Structure

HexCMS Studio works best with repositories organized like this:

```
your-repo/
├── authors/          # Author profiles
│   ├── john.md
│   └── jane.md
├── blog/             # Blog posts
│   ├── my-first-post.md
│   └── another-post.md
└── pages/            # Static pages
    ├── about.md
    └── contact.md
```

---

## Working with Files

### Browsing Files

- Click folder icons (📁) to expand/collapse directories
- Markdown files show with a 📝 icon
- Other files show with a 📄 icon

### Opening a File

- Click any markdown file to open it in the editor
- The file path appears in the header
- Content loads in both the editor and preview

### File Types

| Icon | Type | Editable |
|------|------|----------|
| 📝 | Markdown (.md) | Yes - full editor |
| 📄 | Other files | View only |
| 📁 | Directory | Click to expand |

---

## Creating New Posts

### Quick Create

1. Click **+ New Post** in the header
2. Choose the destination folder
3. Enter a filename (without `.md` extension)
4. Click **Create**

### Post Template

New posts are created with a basic frontmatter template:

```yaml
---
title: ""
author: ""
publishedAt: ""
status: "draft"
featured: false
excerpt: ""
tags: []
---

Your content here...
```

---

## Editing Content

HexCMS Studio offers two editing modes:

### Visual Mode (Default)

- WYSIWYG editing experience
- Toolbar with formatting buttons
- Best for: Writing and formatting content quickly

### Code Mode

- Raw markdown editing
- Syntax highlighting
- Best for: Precise control, complex formatting, or if you prefer markdown

### Switching Modes

Click **Visual** or **Code** in the header toolbar to switch between modes.

> **Note**: Your content is automatically converted between modes, but some complex formatting may look slightly different.

---

## Using the Visual Editor

### Toolbar Reference

| Button | Action | Shortcut |
|--------|--------|----------|
| **B** | Bold text | Ctrl/Cmd + B |
| *I* | Italic text | Ctrl/Cmd + I |
| ~~S~~ | Strikethrough | - |
| `</>` | Inline code | Ctrl/Cmd + E |
| H1 | Heading 1 | - |
| H2 | Heading 2 | - |
| H3 | Heading 3 | - |
| • List | Bullet list | - |
| 1. List | Numbered list | - |
| " Quote | Blockquote | - |
| Link | Insert link | Ctrl/Cmd + K |
| Image | Insert image | - |
| YouTube | Embed YouTube video | - |
| Code Block | Code block | - |
| Undo | Undo change | Ctrl/Cmd + Z |
| Redo | Redo change | Ctrl/Cmd + Shift + Z |

### Formatting Text

1. **Bold**: Select text and click **B** or press `Ctrl/Cmd + B`
2. **Italic**: Select text and click *I* or press `Ctrl/Cmd + I`
3. **Headings**: Place cursor on a line and click H1, H2, or H3

### Creating Lists

1. Click **• List** for bullet points
2. Click **1. List** for numbered lists
3. Press `Tab` to indent, `Shift + Tab` to outdent
4. Press `Enter` twice to exit the list

### Adding Links

1. Select the text you want to link
2. Click **Link** or press `Ctrl/Cmd + K`
3. Enter the URL in the dialog
4. Click **Add Link**

### Adding Images

1. Click **Image** in the toolbar
2. Choose to upload from your computer or enter an image URL
3. For uploads, the image is saved to your post's `images/` folder
4. Click **Insert**

> **Tip**: For local images, use relative paths like `./images/photo.jpg`

### Embedding YouTube Videos

1. Click **YouTube** in the toolbar
2. Paste a YouTube video URL
3. Click **Insert Video**

**Supported URL formats:**
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

The video URL will be inserted as text in your document. When your blog renders the markdown, it will automatically convert to a responsive embedded video player.

> **Note**: The embed conversion happens during rendering via the `rehype-youtube` plugin. In the editor preview, you'll see the URL as text.

### Blockquotes

1. Click **" Quote** to start a blockquote
2. Type your quoted text
3. Press `Enter` twice to exit the quote

---

## Using the Code Editor

### Markdown Syntax Quick Reference

```markdown
# Heading 1
## Heading 2
### Heading 3

**bold text**
*italic text*
~~strikethrough~~
`inline code`

- Bullet item
- Another item

1. Numbered item
2. Another item

> Blockquote text

[Link text](https://example.com)

![Alt text](image-url.jpg)

```code
code block
```
```

### Editor Features

- **Line numbers**: Helps you navigate longer documents
- **Syntax highlighting**: Markdown elements are color-coded
- **Auto-indent**: Lists and code blocks indent automatically
- **History**: Full undo/redo support

---

## Managing Frontmatter

Frontmatter is the metadata at the top of your markdown files. The Frontmatter panel makes it easy to edit.

### Expanding/Collapsing

- Click **Frontmatter ▼** to expand the panel
- Click **Frontmatter ▲** to collapse it

### Fields

| Field | Description | Example |
|-------|-------------|---------|
| **Title** | Post title | "My First Blog Post" |
| **Author** | Author name | "John Doe" |
| **Published At** | Publication date | 2024-01-15 |
| **Status** | Publication status | draft / published / archived |
| **Featured** | Highlight this post | ✓ or unchecked |
| **Excerpt** | Short description | "A brief intro to..." |
| **Tags** | Categories (comma-separated) | "travel, food, tips" |
| **Featured Image** | Image path | "./images/hero.jpg" |
| **Meta Description** | SEO description | "Learn about..." |

### SEO Section

- **Meta Description**: Write a compelling summary for search results
- **Character Counter**: Aim for ~155 characters
- **Generate Button**: Click ✨ **Generate** to auto-generate from content (if available)

---

## Previewing Content

The Preview panel shows how your content will look when rendered.

### Features

- **Live updates**: Changes appear as you type (with slight delay)
- **Full formatting**: Headings, lists, links, images all render
- **Responsive**: Preview adapts to panel width

### Collapsing Preview

- Click the **▶** button to collapse the preview panel
- Click again to expand

### Preview Delay

The preview updates 300ms after you stop typing to avoid excessive rendering.

---

## Git Operations

The Git panel lets you manage version control directly from HexCMS Studio.

### Opening Git Panel

Click **Git** in the header to open the Git panel.

### Status Overview

The panel shows:
- **Current branch**: Your active Git branch
- **Ahead/Behind**: Commits ahead (↑) or behind (↓) remote

### File Changes

Files are grouped by status:

| Status | Color | Description |
|--------|-------|-------------|
| **Staged** | Green | Ready to commit |
| **Modified** | Orange | Changed since last commit |
| **Untracked** | Gray | New files not yet tracked |
| **Deleted** | Red | Removed files |

### Workflow

#### Making a Commit

1. Make changes to your files
2. Open the **Git** panel
3. Click **Stage All** to stage your changes
4. Enter a commit message
5. Click **Commit**

#### Pushing Changes

1. Create one or more commits
2. Click **Push** to send to remote

#### Pulling Changes

1. Click **Pull** to fetch and merge remote changes

### Best Practices

- Write clear, descriptive commit messages
- Commit related changes together
- Pull before pushing to avoid conflicts

---

## Themes

HexCMS Studio includes multiple themes for comfortable editing.

### Changing Themes

1. Click the theme button in the header (e.g., **☀️ Light ▼**)
2. Select your preferred theme

### Available Themes

| Theme | Icon | Best For |
|-------|------|----------|
| **Light** | ☀️ | Bright environments |
| **Dark** | 🌙 | Low-light editing |
| **Midnight** | 🌌 | Deep dark preference |
| **Sepia** | 📜 | Reduced eye strain |
| **System** | 💻 | Match your OS setting |

### Theme Persistence

Your theme choice is saved and remembered between sessions.

---

## Keyboard Shortcuts

### Global

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Save current file |

### Visual Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + E` | Inline code |
| `Ctrl/Cmd + K` | Insert link |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |

### Code Editor

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Save |

---

## Tips & Best Practices

### Writing Content

1. **Start with frontmatter**: Fill in title and metadata first
2. **Use headings**: Structure content with H2 and H3
3. **Add excerpts**: Write compelling summaries for post listings
4. **Preview often**: Check how content renders

### File Organization

1. **Consistent naming**: Use lowercase, hyphens: `my-post-title.md`
2. **Logical folders**: Group related content together
3. **Image management**: Keep images in dedicated folders

### Git Workflow

1. **Save before committing**: Ensure all changes are saved
2. **Atomic commits**: Commit one logical change at a time
3. **Pull regularly**: Stay in sync with your team

### Performance

1. **Large files**: Very large markdown files may slow the editor
2. **Images**: Use optimized images for faster preview loading
3. **Autosave**: Changes are not auto-saved - remember to save!

---

## Troubleshooting

### File Won't Save

- Check that you have write permissions to the repository
- Ensure the file isn't locked by another process
- Try refreshing the page

### Preview Not Updating

- Wait a moment - preview has a 300ms delay
- Check browser console for errors
- Try refreshing the page

### Git Operations Failing

- Ensure Git is installed and accessible
- Check repository permissions
- Verify remote is configured correctly

### Theme Not Applying

- Try refreshing the page
- Clear browser cache
- Check localStorage isn't blocked

---

## Getting Help

If you encounter issues:

1. Check this user guide
2. Review the [README](../README.md)
3. Check browser developer console for errors
4. Report issues to the project maintainers

---

Happy writing! 📝
