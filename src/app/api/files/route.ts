import { NextRequest, NextResponse } from "next/server";
import { getFileTree, readFile, writeFile, deleteFile } from "@/lib/files";
import { getActiveRepo } from "@/lib/config";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    const repo = await getActiveRepo();
    if (!repo) {
      return NextResponse.json({ error: "No active repo" }, { status: 400 });
    }

    const contentDir = path.join(repo.path, repo.contentPath);

    // If path provided, read specific file
    if (filePath) {
      const fullPath = path.join(contentDir, filePath);
      // Security: ensure path is within content directory
      if (!fullPath.startsWith(contentDir)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }
      const content = await readFile(fullPath);
      return NextResponse.json({ path: filePath, content });
    }

    // Otherwise, return file tree
    const tree = await getFileTree(contentDir, contentDir);
    return NextResponse.json({ tree, basePath: contentDir });
  } catch (error) {
    console.error("Failed to read files:", error);
    return NextResponse.json({ error: "Failed to read files" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: filePath, content } = body;

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: "Path and content are required" },
        { status: 400 }
      );
    }

    const repo = await getActiveRepo();
    if (!repo) {
      return NextResponse.json({ error: "No active repo" }, { status: 400 });
    }

    const contentDir = path.join(repo.path, repo.contentPath);
    const fullPath = path.join(contentDir, filePath);

    // Security: ensure path is within content directory
    if (!fullPath.startsWith(contentDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await writeFile(fullPath, content);
    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Failed to write file:", error);
    return NextResponse.json({ error: "Failed to write file" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { path: filePath, content = "" } = body;

    if (!filePath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const repo = await getActiveRepo();
    if (!repo) {
      return NextResponse.json({ error: "No active repo" }, { status: 400 });
    }

    const contentDir = path.join(repo.path, repo.contentPath);
    const fullPath = path.join(contentDir, filePath);

    // Security: ensure path is within content directory
    if (!fullPath.startsWith(contentDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await writeFile(fullPath, content);
    return NextResponse.json({ success: true, path: filePath }, { status: 201 });
  } catch (error) {
    console.error("Failed to create file:", error);
    return NextResponse.json({ error: "Failed to create file" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const repo = await getActiveRepo();
    if (!repo) {
      return NextResponse.json({ error: "No active repo" }, { status: 400 });
    }

    const contentDir = path.join(repo.path, repo.contentPath);
    const fullPath = path.join(contentDir, filePath);

    // Security: ensure path is within content directory
    if (!fullPath.startsWith(contentDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    await deleteFile(fullPath);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete file:", error);
    return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
  }
}
