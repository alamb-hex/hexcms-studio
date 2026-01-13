import { NextRequest, NextResponse } from "next/server";
import { getActiveRepo } from "@/lib/config";
import * as git from "@/lib/git";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    const repo = await getActiveRepo();
    if (!repo) {
      return NextResponse.json({ error: "No active repo" }, { status: 400 });
    }

    switch (action) {
      case "status": {
        const status = await git.getStatus(repo.path);
        return NextResponse.json(status);
      }
      case "diff": {
        const staged = searchParams.get("staged") === "true";
        const file = searchParams.get("file");
        if (file) {
          const diff = await git.getFileDiff(repo.path, file, staged);
          return NextResponse.json({ diff });
        }
        const diff = await git.getDiff(repo.path, staged);
        return NextResponse.json({ diff });
      }
      case "branches": {
        const branches = await git.getBranches(repo.path);
        return NextResponse.json({ branches });
      }
      case "log": {
        const limit = parseInt(searchParams.get("limit") || "20");
        const log = await git.getLog(repo.path, limit);
        return NextResponse.json({ log });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Git operation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Git operation failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const repo = await getActiveRepo();
    if (!repo) {
      return NextResponse.json({ error: "No active repo" }, { status: 400 });
    }

    switch (action) {
      case "stage": {
        const { files } = params;
        if (!files || !Array.isArray(files)) {
          return NextResponse.json(
            { error: "Files array is required" },
            { status: 400 }
          );
        }
        await git.stageFiles(repo.path, files);
        return NextResponse.json({ success: true });
      }
      case "unstage": {
        const { files } = params;
        if (!files || !Array.isArray(files)) {
          return NextResponse.json(
            { error: "Files array is required" },
            { status: 400 }
          );
        }
        await git.unstageFiles(repo.path, files);
        return NextResponse.json({ success: true });
      }
      case "stage-all": {
        await git.stageAll(repo.path);
        return NextResponse.json({ success: true });
      }
      case "commit": {
        const { message } = params;
        if (!message) {
          return NextResponse.json(
            { error: "Commit message is required" },
            { status: 400 }
          );
        }
        const hash = await git.commit(repo.path, message);
        return NextResponse.json({ success: true, hash });
      }
      case "push": {
        const { remote = "origin", branch } = params;
        await git.push(repo.path, remote, branch);
        return NextResponse.json({ success: true });
      }
      case "pull": {
        const { remote = "origin", branch } = params;
        await git.pull(repo.path, remote, branch);
        return NextResponse.json({ success: true });
      }
      case "checkout": {
        const { branch, create = false } = params;
        if (!branch) {
          return NextResponse.json(
            { error: "Branch name is required" },
            { status: 400 }
          );
        }
        await git.checkout(repo.path, branch, create);
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Git operation failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Git operation failed" },
      { status: 500 }
    );
  }
}
