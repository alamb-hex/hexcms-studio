import fs from "fs/promises";
import path from "path";

const CONFIG_DIR = path.join(process.env.HOME || "~", ".hexcms-studio");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export interface RepoConfig {
  id: string;
  name: string;
  path: string;
  contentPath: string; // relative path to content directory (usually "content")
  remote?: string;
  addedAt: string;
}

export interface AppConfig {
  repos: RepoConfig[];
  activeRepoId: string | null;
  theme: "light" | "dark" | "system";
}

const DEFAULT_CONFIG: AppConfig = {
  repos: [],
  activeRepoId: null,
  theme: "system",
};

async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

export async function loadConfig(): Promise<AppConfig> {
  await ensureConfigDir();
  try {
    const data = await fs.readFile(CONFIG_FILE, "utf-8");
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function addRepo(repo: Omit<RepoConfig, "id" | "addedAt">): Promise<RepoConfig> {
  const config = await loadConfig();
  const newRepo: RepoConfig = {
    ...repo,
    id: crypto.randomUUID(),
    addedAt: new Date().toISOString(),
  };
  config.repos.push(newRepo);
  if (!config.activeRepoId) {
    config.activeRepoId = newRepo.id;
  }
  await saveConfig(config);
  return newRepo;
}

export async function removeRepo(id: string): Promise<void> {
  const config = await loadConfig();
  config.repos = config.repos.filter((r) => r.id !== id);
  if (config.activeRepoId === id) {
    config.activeRepoId = config.repos[0]?.id || null;
  }
  await saveConfig(config);
}

export async function setActiveRepo(id: string): Promise<void> {
  const config = await loadConfig();
  if (config.repos.some((r) => r.id === id)) {
    config.activeRepoId = id;
    await saveConfig(config);
  }
}

export async function getActiveRepo(): Promise<RepoConfig | null> {
  const config = await loadConfig();
  if (!config.activeRepoId) return null;
  return config.repos.find((r) => r.id === config.activeRepoId) || null;
}
