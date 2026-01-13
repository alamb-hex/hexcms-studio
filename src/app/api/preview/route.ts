import { NextRequest, NextResponse } from "next/server";
import { processMarkdown, renderMarkdown } from "@/lib/markdown";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, bodyOnly = false } = body;

    if (content === undefined) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (bodyOnly) {
      // Just render markdown body without parsing frontmatter
      const html = await renderMarkdown(content);
      return NextResponse.json({ html });
    }

    // Full processing: parse frontmatter and render body
    const result = await processMarkdown(content);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to render markdown:", error);
    return NextResponse.json(
      { error: "Failed to render markdown" },
      { status: 500 }
    );
  }
}
