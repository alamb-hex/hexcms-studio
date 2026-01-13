import simpleGit, { SimpleGit, StatusResult, DiffResult } from "simple-git";

export interface GitStatus {
  current: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  staged: string[];
  modified: string[];
  deleted: string[];
  untracked: string[];
  conflicted: string[];
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote?: string;
}

function getGit(repoPath: string): SimpleGit {
  return simpleGit(repoPath);
}

export async function getStatus(repoPath: string): Promise<GitStatus> {
  const git = getGit(repoPath);
  const status: StatusResult = await git.status();

  return {
    current: status.current,
    tracking: status.tracking,
    ahead: status.ahead,
    behind: status.behind,
    staged: status.staged,
    modified: status.modified,
    deleted: status.deleted,
    untracked: status.not_added,
    conflicted: status.conflicted,
  };
}

export async function getDiff(
  repoPath: string,
  staged: boolean = false
): Promise<string> {
  const git = getGit(repoPath);
  if (staged) {
    return await git.diff(["--cached"]);
  }
  return await git.diff();
}

export async function getFileDiff(
  repoPath: string,
  filePath: string,
  staged: boolean = false
): Promise<string> {
  const git = getGit(repoPath);
  const args = staged ? ["--cached", "--", filePath] : ["--", filePath];
  return await git.diff(args);
}

export async function stageFiles(
  repoPath: string,
  files: string[]
): Promise<void> {
  const git = getGit(repoPath);
  await git.add(files);
}

export async function unstageFiles(
  repoPath: string,
  files: string[]
): Promise<void> {
  const git = getGit(repoPath);
  await git.reset(["HEAD", "--", ...files]);
}

export async function stageAll(repoPath: string): Promise<void> {
  const git = getGit(repoPath);
  await git.add("-A");
}

export async function commit(
  repoPath: string,
  message: string
): Promise<string> {
  const git = getGit(repoPath);
  const result = await git.commit(message);
  return result.commit;
}

export async function push(
  repoPath: string,
  remote: string = "origin",
  branch?: string
): Promise<void> {
  const git = getGit(repoPath);
  if (branch) {
    await git.push(remote, branch);
  } else {
    await git.push();
  }
}

export async function pull(
  repoPath: string,
  remote: string = "origin",
  branch?: string
): Promise<void> {
  const git = getGit(repoPath);
  if (branch) {
    await git.pull(remote, branch);
  } else {
    await git.pull();
  }
}

export async function getBranches(repoPath: string): Promise<GitBranch[]> {
  const git = getGit(repoPath);
  const result = await git.branch(["-a"]);

  return result.all.map((name) => ({
    name: name.replace(/^remotes\/origin\//, ""),
    current: name === result.current,
    remote: name.startsWith("remotes/") ? name : undefined,
  }));
}

export async function checkout(
  repoPath: string,
  branch: string,
  create: boolean = false
): Promise<void> {
  const git = getGit(repoPath);
  if (create) {
    await git.checkoutLocalBranch(branch);
  } else {
    await git.checkout(branch);
  }
}

export async function cloneRepo(
  url: string,
  targetPath: string
): Promise<void> {
  const git = simpleGit();
  await git.clone(url, targetPath);
}

export async function getLog(
  repoPath: string,
  limit: number = 20
): Promise<Array<{ hash: string; date: string; message: string; author: string }>> {
  const git = getGit(repoPath);
  const log = await git.log({ maxCount: limit });

  return log.all.map((entry) => ({
    hash: entry.hash,
    date: entry.date,
    message: entry.message,
    author: entry.author_name,
  }));
}
