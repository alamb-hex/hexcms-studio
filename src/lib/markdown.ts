import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import { VFile } from "vfile";
import { matter as parseVFileMatter } from "vfile-matter";

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
  const file = new VFile(content);
  parseVFileMatter(file, { strip: true });
  const data = (file.data.matter ?? {}) as Record<string, unknown>;
  const body = String(file);
  return {
    frontmatter: data,
    body,
    raw: content,
  };
}

/**
 * Render markdown body to HTML
 */
export async function renderMarkdown(body: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeHighlight, { detect: true, ignoreMissing: true })
    .use(rehypeStringify);

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

