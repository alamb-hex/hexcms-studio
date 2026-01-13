# HexCMS Studio Installation Guide

This guide walks you through installing and setting up HexCMS Studio on your system.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites](#prerequisites)
3. [Installation Steps](#installation-steps)
4. [Configuration](#configuration)
5. [Running the Application](#running-the-application)
6. [Connecting Your First Repository](#connecting-your-first-repository)
7. [Updating HexCMS Studio](#updating-hexcms-studio)
8. [Troubleshooting Installation](#troubleshooting-installation)

---

## System Requirements

### Minimum Requirements

| Component | Requirement |
|-----------|-------------|
| **Operating System** | Windows 10+, macOS 10.15+, or Linux |
| **RAM** | 4 GB (8 GB recommended) |
| **Disk Space** | 500 MB for application |
| **Display** | 1280x720 minimum resolution |

### Supported Browsers

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

---

## Prerequisites

Before installing HexCMS Studio, you need to install the following software:

### 1. Node.js (Required)

HexCMS Studio requires Node.js version 18 or higher.

#### Check if Node.js is installed:

```bash
node --version
```

If installed, you'll see something like `v18.17.0` or higher.

#### Installing Node.js:

**Option A: Download from nodejs.org (Recommended)**

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** (Long Term Support) version
3. Run the installer
4. Follow the installation wizard
5. Restart your terminal/command prompt

**Option B: Using a version manager**

*macOS/Linux (using nvm):*
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then install Node.js
nvm install 18
nvm use 18
```

*Windows (using nvm-windows):*
1. Download nvm-windows from [github.com/coreybutler/nvm-windows](https://github.com/coreybutler/nvm-windows/releases)
2. Run the installer
3. Open a new command prompt and run:
```bash
nvm install 18
nvm use 18
```

#### Verify installation:

```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

### 2. Git (Required for Git features)

Git is required for version control features (commit, push, pull).

#### Check if Git is installed:

```bash
git --version
```

#### Installing Git:

**Windows:**
1. Download from [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Run the installer
3. Use default options (or customize as needed)
4. Restart your terminal

**macOS:**
```bash
# Option 1: Using Homebrew
brew install git

# Option 2: Install Xcode Command Line Tools
xcode-select --install
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

**Linux (Fedora):**
```bash
sudo dnf install git
```

#### Configure Git (first-time setup):

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### 3. Package Manager (Optional)

npm comes with Node.js, but you can also use alternatives:

**pnpm (faster, efficient):**
```bash
npm install -g pnpm
```

**yarn:**
```bash
npm install -g yarn
```

**bun (fastest):**
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

---

## Installation Steps

### Step 1: Get the Source Code

**Option A: Clone from Git repository**

```bash
# Navigate to where you want to install
cd ~/Projects  # or your preferred directory

# Clone the repository
git clone <repository-url> hexcms-studio

# Enter the directory
cd hexcms-studio
```

**Option B: Download as ZIP**

1. Download the ZIP file from the repository
2. Extract to your preferred location
3. Open terminal and navigate to the extracted folder:
```bash
cd /path/to/hexcms-studio
```

### Step 2: Install Dependencies

Choose your package manager:

**Using npm (default):**
```bash
npm install
```

**Using pnpm:**
```bash
pnpm install
```

**Using yarn:**
```bash
yarn install
```

**Using bun:**
```bash
bun install
```

This will:
- Download all required packages
- Set up the project dependencies
- May take 1-3 minutes depending on your internet speed

#### Expected output:

```
added 350 packages, and audited 351 packages in 45s

found 0 vulnerabilities
```

### Step 3: Build the Application (Production only)

For production use, build the optimized version:

```bash
npm run build
```

This creates an optimized production build in the `.next` folder.

---

## Configuration

### Environment Variables (Optional)

Create a `.env.local` file in the project root for custom configuration:

```bash
# Create the file
touch .env.local
```

Add your configuration:

```env
# Custom port (default is 3000)
PORT=3000

# Base path for content repositories
REPO_BASE_PATH=/path/to/your/repos

# Enable debug logging (development only)
DEBUG=true
```

### Available Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Port to run the server on |
| `REPO_BASE_PATH` | - | Default path when adding repositories |
| `DEBUG` | false | Enable verbose logging |

---

## Running the Application

### Development Mode

For local development with hot-reload:

```bash
npm run dev
```

**Using other package managers:**
```bash
pnpm dev
# or
yarn dev
# or
bun dev
```

#### Expected output:

```
   ▲ Next.js 15.x.x
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 2.5s
```

### Production Mode

For production deployment:

```bash
# Build first (if not already built)
npm run build

# Start the production server
npm start
```

### Accessing the Application

1. Open your web browser
2. Navigate to: **http://localhost:3000**
   - Or the custom port if you configured one
3. You should see the HexCMS Studio interface

---

## Connecting Your First Repository

After launching HexCMS Studio, you need to connect a content repository:

### Step 1: Prepare Your Repository

If you don't have a content repository yet, create one:

```bash
# Create a new directory
mkdir ~/my-content
cd ~/my-content

# Initialize Git repository
git init

# Create basic structure
mkdir -p blog authors
touch blog/.gitkeep authors/.gitkeep

# Create a sample post
cat > blog/hello-world.md << 'EOF'
---
title: "Hello World"
author: "Your Name"
publishedAt: "2024-01-01"
status: "draft"
---

# Hello World

This is my first post!
EOF

# Commit the initial structure
git add .
git commit -m "Initial commit"
```

### Step 2: Add Repository to HexCMS Studio

1. Open HexCMS Studio in your browser
2. Click **+ Add Repo** in the header
3. Enter the details:
   - **Name**: My Content (or any display name)
   - **Path**: Click **Browse** to navigate to your repository, or type the full path
     - Example: `/home/username/my-content`
   - **Content Path** (optional): If your markdown files are in a subdirectory
     - Example: `content`, `docs`, `posts`
     - Leave empty to show files from the repository root
4. Click **Add Repository**

### Step 3: Verify Connection

- The sidebar should now show your repository files
- Click on a markdown file to open it
- You should see the content in the editor

### Removing a Repository

To disconnect a repository from HexCMS Studio:

1. Select the repository from the dropdown
2. Click **Remove Repo** in the header
3. Confirm the removal

> **Note**: This only removes the repository from HexCMS Studio. Your files are not deleted from your filesystem.

---

## Updating HexCMS Studio

### Using Git

If you cloned the repository:

```bash
# Navigate to the project
cd /path/to/hexcms-studio

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild if needed
npm run build
```

### Manual Update

1. Download the new version
2. Back up your `.env.local` file
3. Replace the project files
4. Restore your `.env.local`
5. Run `npm install`
6. Run `npm run build` (for production)

---

## Troubleshooting Installation

### Common Issues

#### "node: command not found"

**Problem**: Node.js is not installed or not in PATH.

**Solution**:
1. Install Node.js from [nodejs.org](https://nodejs.org)
2. Restart your terminal
3. Verify with `node --version`

#### "npm ERR! EACCES permission denied"

**Problem**: Permission issues with npm global packages.

**Solution (macOS/Linux)**:
```bash
# Fix npm permissions
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### "Error: listen EADDRINUSE: address already in use :::3000"

**Problem**: Port 3000 is already in use.

**Solution**:
```bash
# Option 1: Use a different port
PORT=3001 npm run dev

# Option 2: Kill the process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### "Module not found" errors

**Problem**: Dependencies not installed correctly.

**Solution**:
```bash
# Remove node_modules and reinstall
rm -rf node_modules
rm package-lock.json  # or pnpm-lock.yaml, yarn.lock
npm install
```

#### Build fails with memory error

**Problem**: Not enough memory for the build process.

**Solution**:
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Git features not working

**Problem**: Git not configured or repository issues.

**Solution**:
```bash
# Verify Git installation
git --version

# Check Git configuration
git config --list

# Ensure repository has remote configured
cd /path/to/your/repo
git remote -v
```

### Getting Help

If you're still having issues:

1. Check the [User Guide](USER_GUIDE.md)
2. Review error messages in the terminal
3. Check browser console for errors (F12 → Console)
4. Search for the error message online
5. Open an issue on the project repository

---

## Next Steps

After successful installation:

1. Read the [User Guide](USER_GUIDE.md) to learn how to use HexCMS Studio
2. Customize your [theme](THEMING.md) if desired
3. Connect your content repositories
4. Start creating content!

---

## Quick Reference

### Commands Summary

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run code linting |

### Default URLs

| Environment | URL |
|-------------|-----|
| Development | http://localhost:3000 |
| Custom Port | http://localhost:PORT |

---

Happy writing! 📝
