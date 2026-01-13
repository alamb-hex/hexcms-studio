import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { loadConfig } from "@/lib/config";

export async function POST(request: NextRequest) {
  try {
    const config = await loadConfig();
    const activeRepo = config.repos.find((r) => r.id === config.activeRepoId);

    if (!activeRepo) {
      return NextResponse.json({ error: "No active repository" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetPath = formData.get("targetPath") as string; // The markdown file path

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!targetPath) {
      return NextResponse.json({ error: "No target path provided" }, { status: 400 });
    }

    // Get the directory of the markdown file
    const contentDir = path.join(activeRepo.path, activeRepo.contentPath);
    const mdDir = path.dirname(path.join(contentDir, targetPath));

    // Create images subdirectory if it doesn't exist
    const imagesDir = path.join(mdDir, "images");
    await fs.mkdir(imagesDir, { recursive: true });

    // Generate safe filename (keep original name but sanitize)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const imagePath = path.join(imagesDir, safeName);

    // Read file buffer and write to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(imagePath, buffer);

    // Calculate paths for both editor preview and markdown output
    // For editor preview: use API route that serves from content dir
    // For markdown: use relative path from md file's location
    const mdDirRelative = path.dirname(targetPath);
    const apiPath = `/api/images/${mdDirRelative}/images/${safeName}`;
    const markdownPath = `./images/${safeName}`;

    return NextResponse.json({
      success: true,
      path: apiPath,           // For editor preview (served via API)
      markdownPath: markdownPath,  // For markdown output (relative path)
      fullPath: imagePath
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
