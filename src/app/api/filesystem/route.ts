import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

// Security: Define allowed base paths to prevent accessing sensitive system files
const ALLOWED_ROOTS = [
  os.homedir(), // User's home directory
];

function isPathAllowed(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return ALLOWED_ROOTS.some((root) => resolved.startsWith(root));
}

// GET: List directory contents or read file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path") || os.homedir();
    const action = searchParams.get("action") || "list"; // "list" or "read"

    // Security check
    const resolvedPath = path.resolve(targetPath);
    if (!isPathAllowed(resolvedPath)) {
      return NextResponse.json(
        { error: "Access denied: Path outside allowed directories" },
        { status: 403 }
      );
    }

    // Check if path exists
    try {
      await fs.access(resolvedPath);
    } catch {
      return NextResponse.json({ error: "Path not found" }, { status: 404 });
    }

    const stat = await fs.stat(resolvedPath);

    if (action === "read" && stat.isFile()) {
      // Read file content
      const content = await fs.readFile(resolvedPath, "utf-8");
      return NextResponse.json({
        path: resolvedPath,
        content,
        type: "file",
      });
    }

    if (stat.isDirectory()) {
      // List directory contents
      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      const items = entries
        .filter((entry) => !entry.name.startsWith(".")) // Hide dotfiles by default
        .map((entry) => ({
          name: entry.name,
          path: path.join(resolvedPath, entry.name),
          type: entry.isDirectory() ? "directory" : "file",
        }))
        .sort((a, b) => {
          // Directories first, then alphabetical
          if (a.type !== b.type) {
            return a.type === "directory" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

      return NextResponse.json({
        path: resolvedPath,
        parent: path.dirname(resolvedPath),
        items,
        type: "directory",
      });
    }

    // Single file info
    return NextResponse.json({
      path: resolvedPath,
      type: "file",
      name: path.basename(resolvedPath),
    });
  } catch (error) {
    console.error("Filesystem error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Filesystem error" },
      { status: 500 }
    );
  }
}

// PUT: Save file content
export async function PUT(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Security check
    const resolvedPath = path.resolve(filePath);
    if (!isPathAllowed(resolvedPath)) {
      return NextResponse.json(
        { error: "Access denied: Path outside allowed directories" },
        { status: 403 }
      );
    }

    // Write file
    await fs.writeFile(resolvedPath, content, "utf-8");

    return NextResponse.json({ success: true, path: resolvedPath });
  } catch (error) {
    console.error("Write error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Write failed" },
      { status: 500 }
    );
  }
}

// POST: Create new file or directory
export async function POST(request: NextRequest) {
  try {
    const { path: targetPath, type, content } = await request.json();

    if (!targetPath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Security check
    const resolvedPath = path.resolve(targetPath);
    if (!isPathAllowed(resolvedPath)) {
      return NextResponse.json(
        { error: "Access denied: Path outside allowed directories" },
        { status: 403 }
      );
    }

    if (type === "directory") {
      await fs.mkdir(resolvedPath, { recursive: true });
    } else {
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
      await fs.writeFile(resolvedPath, content || "", "utf-8");
    }

    return NextResponse.json({ success: true, path: resolvedPath });
  } catch (error) {
    console.error("Create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 500 }
    );
  }
}

// DELETE: Delete file or directory
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetPath = searchParams.get("path");

    if (!targetPath) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    // Security check
    const resolvedPath = path.resolve(targetPath);
    if (!isPathAllowed(resolvedPath)) {
      return NextResponse.json(
        { error: "Access denied: Path outside allowed directories" },
        { status: 403 }
      );
    }

    // Don't allow deleting the home directory itself
    if (resolvedPath === os.homedir()) {
      return NextResponse.json(
        { error: "Cannot delete home directory" },
        { status: 403 }
      );
    }

    const stat = await fs.stat(resolvedPath);
    if (stat.isDirectory()) {
      await fs.rm(resolvedPath, { recursive: true });
    } else {
      await fs.unlink(resolvedPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
