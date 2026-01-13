import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { loadConfig } from "@/lib/config";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const config = await loadConfig();
    const activeRepo = config.repos.find((r) => r.id === config.activeRepoId);

    if (!activeRepo) {
      return NextResponse.json({ error: "No active repository" }, { status: 400 });
    }

    const { path: pathSegments } = await params;
    const imagePath = pathSegments.join("/");

    // Build full path to image in content directory
    const contentDir = path.join(activeRepo.path, activeRepo.contentPath);
    const fullPath = path.join(contentDir, imagePath);

    // Security: ensure path is within content directory
    const resolvedPath = path.resolve(fullPath);
    const resolvedContentDir = path.resolve(contentDir);
    if (!resolvedPath.startsWith(resolvedContentDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    // Check if file exists
    try {
      await fs.access(fullPath);
    } catch {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Read and serve the image
    const imageBuffer = await fs.readFile(fullPath);

    // Determine content type from extension
    const ext = path.extname(fullPath).toLowerCase();
    const contentTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
    };
    const contentType = contentTypes[ext] || "application/octet-stream";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Image serve error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to serve image" },
      { status: 500 }
    );
  }
}
