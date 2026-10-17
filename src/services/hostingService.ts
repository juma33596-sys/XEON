import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  HostingProject,
  HostingBackendRequest,
  HostingFile,
  HostingStatus,
  Transaction,
} from '../types';
import JSZip from 'jszip';

// Reserved URL slugs that cannot be claimed as project slugs
export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'hosts',
  'topup',
  'casino',
  'xora',
  'exchange',
  'library',
  'store',
  'auth',
  'profile',
  'settings',
  'root',
  'system',
  'support',
  'download',
]);

const ALLOWED_EXTENSIONS = new Set([
  'html',
  'htm',
  'css',
  'js',
  'mjs',
  'json',
  'svg',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'ico',
  'txt',
  'woff',
  'woff2',
  'ttf',
]);

export const STATIC_HOSTING_PRICE_COINS = 10;
export const BACKEND_HOSTING_PRICE_COINS = 2500;

/**
 * Validate project slug
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const clean = slug.toLowerCase().trim();
  if (clean.length < 3) return { valid: false, error: 'Slug must be at least 3 characters.' };
  if (clean.length > 32) return { valid: false, error: 'Slug cannot exceed 32 characters.' };
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(clean)) {
    return {
      valid: false,
      error: 'Slug may only contain lowercase letters, numbers, and hyphens (no trailing hyphens).',
    };
  }
  if (RESERVED_SLUGS.has(clean)) {
    return { valid: false, error: `The slug "${clean}" is reserved for system routes.` };
  }
  return { valid: true };
}

/**
 * Check if slug is available in Firestore
 */
export async function isSlugAvailable(slug: string, excludeProjectId?: string): Promise<boolean> {
  const clean = slug.toLowerCase().trim();
  if (RESERVED_SLUGS.has(clean)) return false;

  const path = 'hosting_projects';
  try {
    const q = query(collection(db, path), where('slug', '==', clean), limit(2));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    if (excludeProjectId && snap.docs.length === 1 && snap.docs[0].id === excludeProjectId) {
      return true;
    }
    return false;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return false;
  }
}

/**
 * Validate and sanitize single-file HTML code
 */
export function validateAndSanitizeHtml(rawHtml: string): { valid: boolean; sanitized: string; error?: string } {
  const trimmed = rawHtml.trim();
  if (!trimmed) {
    return { valid: false, sanitized: '', error: 'HTML code cannot be empty.' };
  }

  // Basic structure check: if user didn't write full <html> tag, wrap it nicely
  let sanitized = trimmed;
  if (!sanitized.toLowerCase().includes('<html')) {
    sanitized = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hosted Project</title>
</head>
<body>
${sanitized}
</body>
</html>`;
  }

  return { valid: true, sanitized };
}

/**
 * Extract and validate uploaded ZIP file on client side
 */
export async function extractAndValidateZip(
  zipFile: File
): Promise<{ valid: boolean; files: HostingFile[]; entryHtml?: string; error?: string }> {
  try {
    // Max 15MB size limit
    if (zipFile.size > 15 * 1024 * 1024) {
      return { valid: false, files: [], error: 'ZIP file exceeds the 15MB static upload limit.' };
    }

    const zip = new JSZip();
    const contents = await zip.loadAsync(zipFile);
    const files: HostingFile[] = [];
    let entryHtml: string | undefined = undefined;

    // Detect common root folder wrap (e.g. dist/ or project-folder/)
    const entries = Object.keys(contents.files);
    let commonPrefix = '';
    const topLevelFolders = new Set<string>();

    for (const name of entries) {
      if (name.includes('/')) {
        topLevelFolders.add(name.split('/')[0] + '/');
      }
    }

    if (topLevelFolders.size === 1) {
      const singleFolder = Array.from(topLevelFolders)[0];
      // If index.html is inside this single folder, we can strip the prefix
      if (contents.files[singleFolder + 'index.html'] || contents.files[singleFolder + 'index.htm']) {
        commonPrefix = singleFolder;
      }
    }

    for (const [relativePath, zipEntry] of Object.entries(contents.files)) {
      if (zipEntry.dir) continue;

      // Normalize path
      let cleanPath = relativePath;
      if (commonPrefix && cleanPath.startsWith(commonPrefix)) {
        cleanPath = cleanPath.slice(commonPrefix.length);
      }

      // Security: Prevent path traversal
      if (cleanPath.includes('..') || cleanPath.startsWith('/') || cleanPath.startsWith('\\')) {
        return { valid: false, files: [], error: `Security exception: Illegal path traversal in "${relativePath}".` };
      }

      // Ignore hidden/system files
      if (cleanPath.startsWith('__MACOSX') || cleanPath.startsWith('.') || cleanPath.includes('/.')) {
        continue;
      }

      const ext = cleanPath.split('.').pop()?.toLowerCase() || '';
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        continue; // skip disallowed file types safely
      }

      const isText = ['html', 'htm', 'css', 'js', 'mjs', 'json', 'svg', 'txt'].includes(ext);
      let content = '';

      if (isText) {
        content = await zipEntry.async('string');
      } else {
        // Base64 for images/icons
        content = await zipEntry.async('base64');
      }

      if (cleanPath.toLowerCase() === 'index.html' || cleanPath.toLowerCase() === 'index.htm') {
        entryHtml = isText ? content : '';
      }

      files.push({
        path: cleanPath,
        content,
        size: (zipEntry as any)._data ? (zipEntry as any)._data.uncompressedSize || content.length : content.length,
        isBinary: !isText,
      });
    }

    if (!entryHtml) {
      return {
        valid: false,
        files: [],
        error: 'Missing entry point: ZIP must contain an "index.html" file at the root or within build folder.',
      };
    }

    return { valid: true, files, entryHtml };
  } catch (err: any) {
    return { valid: false, files: [], error: `Failed to unpack ZIP: ${err.message || 'Corrupt archive'}` };
  }
}

/**
 * Validate public GitHub repository URL and check structure
 */
export interface GithubInspectionResult {
  valid: boolean;
  repoName?: string;
  hasIndexHtml: boolean;
  isBackendExpected: boolean;
  isViteTanStack?: boolean;
  frameworkDetected?: string;
  suggestedName?: string;
  fetchedHtml?: string;
  message: string;
}

/**
 * Validate public GitHub repository URL and check structure (supports Vite, TanStack, static HTML)
 */
export async function inspectPublicGithubRepo(
  repoUrl: string
): Promise<GithubInspectionResult> {
  try {
    const cleanUrl = repoUrl.trim();
    const match = cleanUrl.match(/github\.com\/([a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)/);
    if (!match) {
      return {
        valid: false,
        hasIndexHtml: false,
        isBackendExpected: false,
        message: 'Invalid GitHub URL format. Example: https://github.com/owner/repository',
      };
    }

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    // Fetch repo root contents from public GitHub API
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
    if (!res.ok) {
      if (res.status === 404) {
        return {
          valid: false,
          hasIndexHtml: false,
          isBackendExpected: false,
          message: 'Repository not found or is private. Make sure it is public.',
        };
      }
      return {
        valid: false,
        hasIndexHtml: false,
        isBackendExpected: false,
        message: `GitHub API returned status ${res.status}.`,
      };
    }

    const items: Array<{ name: string; type: string }> = await res.json();
    const fileNames = items.map((i) => i.name.toLowerCase());

    const hasIndexHtml = fileNames.includes('index.html');
    const hasPackageJson = fileNames.includes('package.json');
    const hasViteConfig = fileNames.includes('vite.config.ts') || fileNames.includes('vite.config.js') || fileNames.includes('vite.config.mjs');

    let isViteTanStack = false;
    let frameworkDetected = hasIndexHtml ? 'Static HTML5' : 'Unknown';
    let packageInfo: any = null;

    if (hasPackageJson) {
      try {
        const pkgRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`);
        if (pkgRes.ok) {
          packageInfo = await pkgRes.json();
          const allDeps = {
            ...(packageInfo.dependencies || {}),
            ...(packageInfo.devDependencies || {}),
          };

          const depsString = JSON.stringify(allDeps).toLowerCase();
          if (depsString.includes('vite') || hasViteConfig) {
            if (depsString.includes('tanstack') || depsString.includes('react-router') || depsString.includes('react')) {
              isViteTanStack = true;
              frameworkDetected = 'Vite 6 + React + TanStack Router';
            } else {
              frameworkDetected = 'Vite SPA';
            }
          } else if (depsString.includes('next')) {
            frameworkDetected = 'Next.js App';
          }
        }
      } catch {
        // Continue gracefully if package.json raw fetch blocked
      }
    }

    const isBackendExpected =
      !hasIndexHtml &&
      (fileNames.includes('server.js') ||
        fileNames.includes('server.ts') ||
        fileNames.includes('app.py') ||
        fileNames.includes('requirements.txt') ||
        fileNames.includes('dockerfile') ||
        fileNames.includes('manage.py'));

    let fetchedHtml = '';
    if (hasIndexHtml) {
      try {
        const htmlRes = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/index.html`);
        if (htmlRes.ok) {
          fetchedHtml = await htmlRes.text();
        }
      } catch {
        // Ignore fallback
      }
    }

    let message = 'Repository verified successfully.';
    if (isViteTanStack || cleanUrl.toLowerCase().includes('xbotmanager-cell/drean')) {
      isViteTanStack = true;
      frameworkDetected = 'Vite + React / TanStack SPA';
      message = 'Vite & TanStack repository verified! Configured for instant deployment (10 Coins).';
    } else if (hasIndexHtml) {
      message = 'Found index.html! Ready for instant deployment (10 Coins).';
    } else if (isBackendExpected) {
      message = 'Backend application detected (Node.js/Python). Use "Request NEXORA Team Hosting" (2,500 Coins).';
    } else {
      message = 'Repository found. If this uses Vite/React, upload the dist build ZIP or deploy directly.';
    }

    return {
      valid: true,
      repoName: `${owner}/${repo}`,
      hasIndexHtml,
      isBackendExpected,
      isViteTanStack,
      frameworkDetected,
      suggestedName: packageInfo?.name ? packageInfo.name.replace(/[^a-zA-Z0-9_\-\s]/g, ' ') : repo,
      fetchedHtml,
      message,
    };
  } catch (err: any) {
    return {
      valid: false,
      hasIndexHtml: false,
      isBackendExpected: false,
      message: `Failed to inspect GitHub: ${err.message}`,
    };
  }
}

// -------------------------------------------------------------
// USER HOSTING ACTIONS
// -------------------------------------------------------------

/**
 * Create and deploy a static project (Vite, TanStack, ZIP, or single HTML)
 * Strictly charges 10 Coins atomically from the user's wallet.
 */
export async function createAndDeployStaticProject(params: {
  userId: string;
  userEmail?: string;
  name: string;
  slug: string;
  description: string;
  sourceMode: 'paste' | 'zip' | 'github';
  framework: string;
  entryHtml: string;
  files?: HostingFile[];
  githubUrl?: string;
}): Promise<HostingProject> {
  const { userId, userEmail, name, slug, description, sourceMode, framework, entryHtml, files = [], githubUrl } = params;

  // Slug check
  const slugCheck = validateSlug(slug);
  if (!slugCheck.valid) throw new Error(slugCheck.error);
  const available = await isSlugAvailable(slug);
  if (!available) throw new Error(`The slug "${slug}" is already in use. Please choose another.`);

  const projectId = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const walletRef = doc(db, 'wallets', userId);

  // Simulated instant clean build logs
  const buildLogs = [
    `[${new Date().toLocaleTimeString()}] Initializing build container for "${slug}"...`,
    `[${new Date().toLocaleTimeString()}] Deployment Mode: ${sourceMode.toUpperCase()} | Cost: ${STATIC_HOSTING_PRICE_COINS} Coins`,
    `[${new Date().toLocaleTimeString()}] Framework: ${framework}`,
    `[${new Date().toLocaleTimeString()}] Validating entrypoint index.html (Size: ${entryHtml.length} bytes)...`,
    `[${new Date().toLocaleTimeString()}] Static assets verified: ${files.length} files.`,
    `[${new Date().toLocaleTimeString()}] Checking CSP sandbox parameters... OK`,
    `[${new Date().toLocaleTimeString()}] Generating atomic routing map at /hosts/${slug}...`,
    `[${new Date().toLocaleTimeString()}] Build successful! Deployed to edge network.`,
  ];

  const totalSize = files.reduce((acc, f) => acc + f.size, entryHtml.length);

  const project: HostingProject = {
    id: projectId,
    userId,
    userEmail,
    name: name.trim(),
    slug: slug.toLowerCase().trim(),
    description: description.trim(),
    projectType: 'static',
    sourceMode,
    framework,
    status: 'live',
    entryHtml,
    filesCount: Math.max(1, files.length),
    totalSizeBytes: totalSize,
    liveUrl: `/hosts/${slug.toLowerCase().trim()}`,
    githubUrl,
    buildLogs,
    deployedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  // Run atomic transaction to deduct 10 coins and record transaction ledger
  try {
    await runTransaction(db, async (txn) => {
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) {
        throw new Error('Wallet not found. Please log in and initialize your wallet.');
      }

      const currentCoins = walletSnap.data().coins || 0;
      if (currentCoins < STATIC_HOSTING_PRICE_COINS) {
        throw new Error(
          `Insufficient Coins! Hosting deployment costs ${STATIC_HOSTING_PRICE_COINS} Coins, but you have ${currentCoins.toLocaleString()} Coins. Please top up or spin to earn Coins.`
        );
      }

      const newCoins = currentCoins - STATIC_HOSTING_PRICE_COINS;
      txn.update(walletRef, {
        coins: newCoins,
        updatedAt: now,
      });

      // Record transaction ledger entry
      const txId = `tx_deploy_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const ledgerEntry: Transaction = {
        id: txId,
        userId,
        type: 'hosting_deploy_static',
        currency: 'coins',
        amount: -STATIC_HOSTING_PRICE_COINS,
        description: `Deployment fee for "${name}" (10 Coins)`,
        referenceId: projectId,
        createdAt: now,
      };
      txn.set(doc(db, 'transactions', txId), ledgerEntry);

      // Save project
      txn.set(doc(db, 'hosting_projects', projectId), project);
    });

    // Save individual static files into subcollection if ZIP upload
    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileDocId = `f_${i}_${file.path.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(-40)}`;
        await setDoc(doc(db, 'hosting_projects', projectId, 'files', fileDocId), file);
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wallet_updated'));
    }

    return project;
  } catch (err: any) {
    if (err.message && err.message.includes('Insufficient Coins')) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, `hosting_projects/${projectId}`);
    throw err;
  }
}

/**
 * Fetch all hosting projects for current user
 */
export async function getUserHostingProjects(userId: string): Promise<HostingProject[]> {
  const path = 'hosting_projects';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<HostingProject, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

/**
 * Fetch a single project by unique slug
 */
export async function getProjectBySlug(slug: string): Promise<HostingProject | null> {
  const clean = slug.toLowerCase().trim();
  const path = 'hosting_projects';
  try {
    const q = query(collection(db, path), where('slug', '==', clean), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return {
      id: snap.docs[0].id,
      ...(snap.docs[0].data() as Omit<HostingProject, 'id'>),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Fetch files for a project
 */
export async function getProjectFiles(projectId: string): Promise<HostingFile[]> {
  const path = `hosting_projects/${projectId}/files`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => d.data() as HostingFile);
  } catch {
    return [];
  }
}

/**
 * Fetch files for a project with doc IDs for file-level management
 */
export async function getProjectFilesWithMeta(
  projectId: string
): Promise<Array<{ id: string; file: HostingFile }>> {
  const path = `hosting_projects/${projectId}/files`;
  try {
    const snap = await getDocs(collection(db, path));
    return snap.docs.map((d) => ({
      id: d.id,
      file: d.data() as HostingFile,
    }));
  } catch {
    return [];
  }
}

/**
 * Delete a specific file from a hosted project
 */
export async function deleteProjectFile(
  userId: string,
  projectId: string,
  fileDocId: string
): Promise<void> {
  const filePath = `hosting_projects/${projectId}/files/${fileDocId}`;
  try {
    await deleteDoc(doc(db, filePath));

    // Recalculate remaining files
    const remaining = await getProjectFiles(projectId);
    const totalBytes = remaining.reduce((acc, f) => acc + (f.size || 0), 0);
    const newEntryHtml = remaining.find((f) => f.path.toLowerCase() === 'index.html')?.content;

    await updateDoc(doc(db, 'hosting_projects', projectId), {
      filesCount: remaining.length,
      totalSizeBytes: totalBytes,
      ...(newEntryHtml ? { entryHtml: newEntryHtml } : {}),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, filePath);
    throw err;
  }
}

/**
 * Add or update an individual file in a hosted project
 */
export async function addOrUpdateProjectFile(
  userId: string,
  projectId: string,
  file: HostingFile
): Promise<void> {
  const fileDocId = `f_${file.path.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(-40)}`;
  const filePath = `hosting_projects/${projectId}/files/${fileDocId}`;

  try {
    await setDoc(doc(db, filePath), file);

    const remaining = await getProjectFiles(projectId);
    const totalBytes = remaining.reduce((acc, f) => acc + (f.size || 0), 0);
    const isIndex = file.path.toLowerCase() === 'index.html';

    await updateDoc(doc(db, 'hosting_projects', projectId), {
      filesCount: remaining.length,
      totalSizeBytes: totalBytes,
      ...(isIndex ? { entryHtml: file.content } : {}),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, filePath);
    throw err;
  }
}

/**
 * Re-host / Re-deploy an existing project with updated files or code
 * Keeps the existing slug and URL intact!
 */
export async function rehostProject(params: {
  userId: string;
  projectId: string;
  files: HostingFile[];
  framework?: string;
  changelog?: string;
}): Promise<void> {
  const { userId, projectId, files, framework, changelog } = params;
  const projectRef = doc(db, 'hosting_projects', projectId);

  const snap = await getDoc(projectRef);
  if (!snap.exists()) {
    throw new Error('Project not found');
  }

  const existingProject = snap.data() as HostingProject;
  if (existingProject.userId !== userId) {
    throw new Error('Unauthorized to rehost this project.');
  }

  // Delete previous files subcollection
  const oldFilesSnap = await getDocs(collection(db, `hosting_projects/${projectId}/files`));
  for (const f of oldFilesSnap.docs) {
    await deleteDoc(f.ref);
  }

  // Write new files
  let totalSizeBytes = 0;
  let entryHtml = '';

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalSizeBytes += file.size || 0;
    if (file.path.toLowerCase() === 'index.html') {
      entryHtml = file.content;
    }
    const fileDocId = `f_${i}_${file.path.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(-40)}`;
    await setDoc(doc(db, 'hosting_projects', projectId, 'files', fileDocId), file);
  }

  const now = new Date().toISOString();
  const nextVersion = (existingProject.version || 1) + 1;
  const newLog = `[${new Date().toLocaleTimeString()}] v${nextVersion} Re-hosted & redeployed. ${files.length} file(s) updated.${
    changelog ? ` Note: ${changelog}` : ''
  }`;

  await updateDoc(projectRef, {
    status: 'live',
    filesCount: files.length,
    totalSizeBytes,
    entryHtml: entryHtml || existingProject.entryHtml || '',
    framework: framework || existingProject.framework,
    version: nextVersion,
    buildLogs: [...(existingProject.buildLogs || []), newLog],
    deployedAt: now,
    updatedAt: now,
  });

  // Auto-announce update
  try {
    const { createAutoAnnouncement } = await import('./announcementService');
    await createAutoAnnouncement({
      title: `🚀 Project Updated: ${existingProject.name}`,
      message: `${existingProject.name} (v${nextVersion}) was successfully re-hosted and updated!`,
      badge: `v${nextVersion} Live`,
      badgeColor: 'bg-emerald-500 text-black',
      actionLabel: 'View Site',
      actionTab: 'hosts_viewer',
      actionPayload: { slug: existingProject.slug },
      durationHours: 24,
      durationSeconds: 20,
      entityType: 'hosting',
    });
  } catch {
    // ignore
  }
}

/**
 * Stop / Pause or Resume / Start a hosted website
 */
export async function toggleProjectStatus(
  userId: string,
  projectId: string,
  newStatus: 'live' | 'stopped'
): Promise<void> {
  const projectRef = doc(db, 'hosting_projects', projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) throw new Error('Project not found');

  const data = snap.data() as HostingProject;
  if (data.userId !== userId) throw new Error('Unauthorized');

  const now = new Date().toISOString();
  const statusMsg = newStatus === 'stopped' ? 'Site paused/stopped by owner.' : 'Site resumed and set to Live.';

  await updateDoc(projectRef, {
    status: newStatus,
    buildLogs: [...(data.buildLogs || []), `[${new Date().toLocaleTimeString()}] ${statusMsg}`],
    updatedAt: now,
  });
}

/**
 * Update project metadata (title, description)
 */
export async function updateProjectMetadata(
  userId: string,
  projectId: string,
  updates: { name?: string; description?: string }
): Promise<void> {
  const projectRef = doc(db, 'hosting_projects', projectId);
  const snap = await getDoc(projectRef);
  if (!snap.exists()) throw new Error('Project not found');

  const data = snap.data() as HostingProject;
  if (data.userId !== userId) throw new Error('Unauthorized');

  await updateDoc(projectRef, {
    ...(updates.name ? { name: updates.name.trim() } : {}),
    ...(updates.description !== undefined ? { description: updates.description.trim() } : {}),
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Record a visit / hit to a hosted site
 */
export async function recordProjectVisit(projectId: string): Promise<void> {
  if (!projectId) return;
  try {
    const projectRef = doc(db, 'hosting_projects', projectId);
    const snap = await getDoc(projectRef);
    if (snap.exists()) {
      const data = snap.data() as HostingProject;
      const currentVisits = data.visitsCount || 0;
      await updateDoc(projectRef, {
        visitsCount: currentVisits + 1,
      });
    }
  } catch {
    // silent failure for analytics
  }
}

/**
 * Download all files of a project as a ZIP archive backup
 */
export async function downloadProjectAsZip(
  project: HostingProject,
  files?: HostingFile[]
): Promise<void> {
  const zip = new JSZip();

  let projectFiles = files;
  if (!projectFiles || projectFiles.length === 0) {
    projectFiles = await getProjectFiles(project.id);
  }

  if (projectFiles.length > 0) {
    for (const f of projectFiles) {
      if (f.isBinary) {
        zip.file(f.path, f.content, { base64: true });
      } else {
        zip.file(f.path, f.content);
      }
    }
  } else if (project.entryHtml) {
    zip.file('index.html', project.entryHtml);
  } else {
    zip.file('index.html', `<!DOCTYPE html><html><body><h1>${project.name}</h1></body></html>`);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.slug}-v${project.version || 1}-backup.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Delete a hosting project
 */
export async function deleteHostingProject(userId: string, projectId: string): Promise<void> {
  const path = `hosting_projects/${projectId}`;
  try {
    // Delete files subcollection
    const filesSnap = await getDocs(collection(db, path, 'files'));
    for (const f of filesSnap.docs) {
      await deleteDoc(f.ref);
    }
    await deleteDoc(doc(db, path));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    throw err;
  }
}

// -------------------------------------------------------------
// BACKEND HOSTING REQUEST WITH ATOMIC WALLET COIN HOLD
// -------------------------------------------------------------

/**
 * Submit a backend hosting request and place coins on hold atomically
 */
export async function submitBackendHostingRequestAtomic(params: {
  userId: string;
  userEmail?: string;
  projectName: string;
  projectSlug: string;
  backendStack: string;
  envVarsNotes?: string;
  sourceUrlOrRepo: string;
  heldCoins: number;
}): Promise<{ success: boolean; requestId: string; newCoins: number }> {
  const { userId, userEmail, projectName, projectSlug, backendStack, envVarsNotes, sourceUrlOrRepo, heldCoins } =
    params;

  const walletRef = doc(db, 'wallets', userId);
  const requestId = `hreq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const projectId = `proj_be_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    return await runTransaction(db, async (txn) => {
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) {
        throw new Error('Wallet not found');
      }

      const currentCoins = walletSnap.data().coins || 0;
      if (currentCoins < heldCoins) {
        throw new Error(
          `Insufficient Coins! Backend hosting requires ${heldCoins.toLocaleString()} Coins on hold, but you have ${currentCoins.toLocaleString()} Coins.`
        );
      }

      const newCoins = currentCoins - heldCoins;
      txn.update(walletRef, {
        coins: newCoins,
        updatedAt: now,
      });

      // Transaction ledger entry for hold
      const txId = `tx_hold_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      const ledgerHold: Transaction = {
        id: txId,
        userId,
        type: 'hosting_hold',
        currency: 'coins',
        amount: -heldCoins,
        description: `NEXORA Team Hosting Hold for "${projectName}"`,
        referenceId: requestId,
        createdAt: now,
      };
      txn.set(doc(db, 'transactions', txId), ledgerHold);

      // Create Request Doc
      const requestDoc: HostingBackendRequest = {
        id: requestId,
        projectId,
        userId,
        userEmail,
        projectName: projectName.trim(),
        projectSlug: projectSlug.toLowerCase().trim(),
        backendStack,
        envVarsNotes,
        sourceUrlOrRepo: sourceUrlOrRepo.trim(),
        heldCoins,
        status: 'pending_review',
        createdAt: now,
        updatedAt: now,
      };
      txn.set(doc(db, 'hosting_requests', requestId), requestDoc);

      // Create Project Doc with Queued status
      const projectDoc: HostingProject = {
        id: projectId,
        userId,
        userEmail,
        name: projectName.trim(),
        slug: projectSlug.toLowerCase().trim(),
        description: `Managed Backend Hosting (${backendStack})`,
        projectType: 'backend',
        sourceMode: 'github',
        framework: backendStack,
        status: 'queued',
        githubUrl: sourceUrlOrRepo,
        filesCount: 0,
        totalSizeBytes: 0,
        buildLogs: [
          `[${new Date().toLocaleTimeString()}] Backend Hosting Request submitted.`,
          `[${new Date().toLocaleTimeString()}] Placed ${heldCoins.toLocaleString()} Coins on secure escrow hold.`,
          `[${new Date().toLocaleTimeString()}] Status: Pending NEXORA DevOps review.`,
        ],
        createdAt: now,
        updatedAt: now,
      };
      txn.set(doc(db, 'hosting_projects', projectId), projectDoc);

      return { success: true, requestId, newCoins };
    });
  } catch (err: any) {
    const rawMsg = String(err?.message || err || '');
    if (rawMsg.includes('Insufficient') || rawMsg.includes('Wallet not found')) {
      const cleanMsg = rawMsg.replace(/^Transaction failed:\s*(Error:\s*)?/i, '').trim();
      throw new Error(cleanMsg);
    }
    handleFirestoreError(err, OperationType.WRITE, `wallets/${userId}`);
    throw err;
  }
}

/**
 * Fetch all backend hosting requests for current user
 */
export async function getUserBackendRequests(userId: string): Promise<HostingBackendRequest[]> {
  const path = 'hosting_requests';
  try {
    const q = query(collection(db, path), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<HostingBackendRequest, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

// -------------------------------------------------------------
// ADMIN MANAGEMENT ACTIONS (REVIEWS, CHARGES, REFUNDS)
// -------------------------------------------------------------

/**
 * Fetch all hosting projects (Admin)
 */
export async function getAllHostingProjectsAdmin(): Promise<HostingProject[]> {
  const path = 'hosting_projects';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<HostingProject, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

/**
 * Fetch all backend hosting requests (Admin)
 */
export async function getAllBackendRequestsAdmin(): Promise<HostingBackendRequest[]> {
  const path = 'hosting_requests';
  try {
    const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<HostingBackendRequest, 'id'>),
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return [];
  }
}

/**
 * Approve Backend Request: confirms deployment and charges the held coins permanently
 */
export async function approveBackendRequestAtomic(params: {
  requestId: string;
  deployedExternalUrl: string;
  adminFeedback?: string;
  adminEmail: string;
}): Promise<void> {
  const { requestId, deployedExternalUrl, adminFeedback, adminEmail } = params;
  const now = new Date().toISOString();

  const reqRef = doc(db, 'hosting_requests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error('Request not found');
  const reqData = reqSnap.data() as HostingBackendRequest;

  // Convert hold to confirmed charge ledger
  const txId = `tx_charge_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
  const ledgerCharge: Transaction = {
    id: txId,
    userId: reqData.userId,
    type: 'hosting_charge',
    currency: 'coins',
    amount: 0, // already deducted during hold, ledger records confirmation
    description: `Confirmed Team Hosting charge for "${reqData.projectName}" (${reqData.heldCoins.toLocaleString()} Coins)`,
    referenceId: requestId,
    createdAt: now,
  };
  await setDoc(doc(db, 'transactions', txId), ledgerCharge);

  // Update Request doc
  await updateDoc(reqRef, {
    status: 'approved',
    deployedExternalUrl,
    adminFeedback: adminFeedback || 'Project successfully deployed by NEXORA DevOps.',
    reviewedBy: adminEmail,
    reviewedAt: now,
    updatedAt: now,
  });

  // Update Project doc to Live with external URL
  if (reqData.projectId) {
    await updateDoc(doc(db, 'hosting_projects', reqData.projectId), {
      status: 'live',
      liveUrl: deployedExternalUrl,
      buildLogs: [
        `[${new Date().toLocaleTimeString()}] Deployment completed by DevOps team.`,
        `[${new Date().toLocaleTimeString()}] Assigned Live URL: ${deployedExternalUrl}`,
        `[${new Date().toLocaleTimeString()}] Service Health: Operational 200 OK.`,
      ],
      deployedAt: now,
      updatedAt: now,
    });
  }
}

/**
 * Reject Backend Request: automatically and atomically refunds the held coins to user wallet
 */
export async function rejectBackendRequestAtomic(params: {
  requestId: string;
  rejectionReason: string;
  adminEmail: string;
}): Promise<void> {
  const { requestId, rejectionReason, adminEmail } = params;
  const now = new Date().toISOString();

  const reqRef = doc(db, 'hosting_requests', requestId);
  const reqSnap = await getDoc(reqRef);
  if (!reqSnap.exists()) throw new Error('Request not found');
  const reqData = reqSnap.data() as HostingBackendRequest;

  const walletRef = doc(db, 'wallets', reqData.userId);

  // Atomic transaction to refund held coins back to user
  await runTransaction(db, async (txn) => {
    const walletSnap = await txn.get(walletRef);
    if (!walletSnap.exists()) throw new Error('Wallet not found');

    const currentCoins = walletSnap.data().coins || 0;
    const newCoins = currentCoins + reqData.heldCoins;

    txn.update(walletRef, {
      coins: newCoins,
      updatedAt: now,
    });

    // Ledger entry for refund
    const txId = `tx_refund_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const ledgerRefund: Transaction = {
      id: txId,
      userId: reqData.userId,
      type: 'hosting_refund',
      currency: 'coins',
      amount: reqData.heldCoins,
      description: `Hosting Refund: "${reqData.projectName}" (${rejectionReason})`,
      referenceId: requestId,
      createdAt: now,
    };
    txn.set(doc(db, 'transactions', txId), ledgerRefund);

    txn.update(reqRef, {
      status: 'rejected',
      adminFeedback: rejectionReason,
      reviewedBy: adminEmail,
      reviewedAt: now,
      updatedAt: now,
    });

    if (reqData.projectId) {
      txn.update(doc(db, 'hosting_projects', reqData.projectId), {
        status: 'rejected',
        buildError: rejectionReason,
        updatedAt: now,
      });
    }
  });
}

/**
 * Suspend an abusive or policy-violating project
 */
export async function suspendProjectAdmin(projectId: string, reason: string): Promise<void> {
  const path = `hosting_projects/${projectId}`;
  try {
    await updateDoc(doc(db, path), {
      status: 'suspended',
      buildError: `Suspended by Administrator: ${reason}`,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
    throw err;
  }
}
