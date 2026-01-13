import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import matter from "gray-matter";

export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
  raw: string;
}

export interface RenderedMarkdown {
  html: string;
  frontmatter: Record<string, unknown>;
}

/**
 * Parse markdown file content into frontmatter and body
 */
export function parseMarkdown(content: string): ParsedMarkdown {
  const { data, content: body } = matter(content);
  return {
    frontmatter: data,
    body,
    raw: content,
  };
}

/**
 * Serialize frontmatter and body back to markdown string
 */
export function serializeMarkdown(
  frontmatter: Record<string, unknown>,
  body: string
): string {
  return matter.stringify(body, frontmatter);
}

/**
 * Render markdown body to HTML
 */
export async function renderMarkdown(body: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const result = await processor.process(body);
  return String(result);
}

/**
 * Full pipeline: parse and render markdown
 */
export async function processMarkdown(content: string): Promise<RenderedMarkdown> {
  const { frontmatter, body } = parseMarkdown(content);
  const html = await renderMarkdown(body);
  return { html, frontmatter };
}

/**
 * Default frontmatter template for new posts
 */
export function getDefaultFrontmatter(): Record<string, unknown> {
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

/**
 * Create a new post with default frontmatter
 */
export function createNewPost(title: string = "Untitled Post"): string {
  const frontmatter = {
    ...getDefaultFrontmatter(),
    title,
  };
  return serializeMarkdown(frontmatter, "\n\nStart writing here...\n");
}

/**
 * Validate frontmatter has required fields
 */
export function validateFrontmatter(
  frontmatter: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!frontmatter.title || typeof frontmatter.title !== "string") {
    errors.push("Title is required");
  }

  if (frontmatter.status && !["draft", "published", "archived"].includes(frontmatter.status as string)) {
    errors.push("Status must be draft, published, or archived");
  }

  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    errors.push("Tags must be an array");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
