import { NextRequest, NextResponse } from "next/server";
import { loadConfig, addRepo, removeRepo, setActiveRepo } from "@/lib/config";
import { fileExists } from "@/lib/files";
import path from "path";

export async function GET() {
  try {
    const config = await loadConfig();
    return NextResponse.json({
      repos: config.repos,
      activeRepoId: config.activeRepoId,
    });
  } catch (error) {
    console.error("Failed to load config:", error);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, path: repoPath, contentPath = "content" } = body;

    if (!name || !repoPath) {
      return NextResponse.json(
        { error: "Name and path are required" },
        { status: 400 }
      );
    }

    // Verify path exists
    const fullContentPath = path.join(repoPath, contentPath);
    if (!(await fileExists(repoPath))) {
      return NextResponse.json(
        { error: "Repository path does not exist" },
        { status: 400 }
      );
    }

    const repo = await addRepo({ name, path: repoPath, contentPath });
    return NextResponse.json(repo, { status: 201 });
  } catch (error) {
    console.error("Failed to add repo:", error);
    return NextResponse.json({ error: "Failed to add repo" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await removeRepo(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove repo:", error);
    return NextResponse.json({ error: "Failed to remove repo" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { activeRepoId } = body;

    if (!activeRepoId) {
      return NextResponse.json(
        { error: "activeRepoId is required" },
        { status: 400 }
      );
    }

    await setActiveRepo(activeRepoId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to set active repo:", error);
    return NextResponse.json({ error: "Failed to set active repo" }, { status: 500 });
  }
}
