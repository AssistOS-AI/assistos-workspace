const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const { URL } = require('url');

async function checkGitHubRepoVisibility(repoUrl) {
    const url = new URL(repoUrl);
    let repoPath = url.pathname.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes

    if (repoPath.includes('.git')) {
        repoPath = repoPath.replace('.git', '');
    }

    const apiUrl = `https://api.github.com/repos/${repoPath}`;
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'User-Agent': 'NodeJS',
        },
    });

    if (response.ok) { // status 200-299
        const repoData = await response.json();
        return repoData.private ? 'Private' : 'Public';
    }
    if (response.status === 404) {
        throw new Error('Repository not found or private');
    }
    throw new Error(`GitHub API responded with status code ${response.status}`);
}

async function clone(repository, folderPath) {

    let visibility;
    try {
        visibility = await checkGitHubRepoVisibility(repository);
        console.log(`The repository ${repository} is ${visibility}`);
    } catch (error) {
        console.log(error);
    }

    if(!visibility || visibility === "Private") {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error("GITHUB_TOKEN environment variable is not set.");
        }

        const authenticatedRepo = repository.replace(
            "https://github.com/",
            `https://${token}@github.com/`
        );
        return await execAsync(`git clone ${authenticatedRepo} ${folderPath}`);
    }

    await execAsync(`git clone ${repository} ${folderPath}`);
}

async function getLastCommitDate(repoPath) {
    try {
        const { stdout } = await execAsync(`git -C ${repoPath} log -1 --format=%cd`);
        return stdout.trim();
    } catch (error) {
        throw new Error(`Failed to get last commit date: ${error.message}`);
    }
}
async function checkForUpdates(localPath, remoteUrl) {
    if (!fs.existsSync(localPath)) {
        throw new Error("Local repository path does not exist.");
    }

    if (!fs.existsSync(path.join(localPath, '.git'))) {
        throw new Error("The specified path is not a Git repository.");
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error("GITHUB_TOKEN environment variable is not set.");
    }
    const remoteUrlWithToken = token
        ? remoteUrl.replace("https://github.com/", `https://${token}@github.com/`)
        : remoteUrl;

    try {
        // const { stdout: currentRemoteUrl } = await execAsync(`git -C ${localPath} remote get-url origin`);
        // if (currentRemoteUrl.trim() !== remoteUrl && currentRemoteUrl.trim() !== remoteUrlWithToken) {
        //     throw new Error(`Remote URL mismatch. Expected: ${remoteUrl} or ${remoteUrlWithToken}, Found: ${currentRemoteUrl.trim()}`);
        // }

        await execAsync(`git -C ${localPath} fetch`);

        const { stdout: branchStdout } = await execAsync(`git -C ${localPath} rev-parse --abbrev-ref HEAD`);
        const branch = branchStdout.trim();

        const { stdout: localCommit } = await execAsync(`git -C ${localPath} rev-parse ${branch}`);
        const { stdout: remoteCommit } = await execAsync(`git -C ${localPath} rev-parse origin/${branch}`);

        return localCommit.trim() !== remoteCommit.trim();
    } catch (error) {
        if (!token) {
            throw new Error(`Failed to check for updates: ${error.message}`);
        }

        try {
            const { stdout: currentRemoteUrl } = await execAsync(`git -C ${localPath} remote get-url origin`);
            if (currentRemoteUrl.trim() !== remoteUrlWithToken) {
                throw new Error(`Remote URL mismatch even after retry. Expected: ${remoteUrlWithToken}, Found: ${currentRemoteUrl.trim()}`);
            }

            await execAsync(`git -C ${localPath} fetch`);
            const { stdout: branchStdout } = await execAsync(`git -C ${localPath} rev-parse --abbrev-ref HEAD`);
            const branch = branchStdout.trim();
            const { stdout: localCommit } = await execAsync(`git -C ${localPath} rev-parse ${branch}`);
            const { stdout: remoteCommit } = await execAsync(`git -C ${localPath} rev-parse origin/${branch}`);

            return localCommit.trim() !== remoteCommit.trim();
        } catch (retryError) {
            throw new Error(`Failed to check for updates after retry with token: ${retryError.message}`);
        }
    }
}

async function updateRepo(localPath) {
    try {
        const { stdout: branchStdout } = await execAsync(`git -C ${localPath} rev-parse --abbrev-ref HEAD`);
        const branch = branchStdout.trim();

        await execAsync(`git -C ${localPath} fetch origin`);

        await execAsync(`git -C ${localPath} reset --hard origin/${branch}`);

        return localPath;
    } catch (error) {
        throw new Error(`Failed to update repository: ${error.message}`);
    }
}
async function installDependencies(repoPath) {
    try {
        await execAsync(`npm install`, {
            cwd: repoPath, // Set the working directory
        });
    } catch (error) {
        throw new Error(`Failed to install dependencies: ${error.message}`);
    }
}
async function uninstallDependencies(dependencies) {
    try {
        if(!dependencies) {
            return;
        }
        const parentDir = `${process.cwd()}/..`;
        for(let dependency of dependencies) {
            await execAsync(`npm uninstall ${dependency}`, {
                cwd: parentDir, // Set the working directory
            });
        }
    } catch (error) {
        throw new Error(`Failed to uninstall dependencies: ${error.message}`);
    }
}

/**
 * Creates a local Git repository, publishes it to GitHub, and pushes the initial commit.
 * @param {string} repoName - The name of the repository.
 * @param {string} localPath - The local path where the repository will be created.
 * @param {string} [description=''] - A short description of the repository.
 * @param {boolean} [isPrivate=false] - Whether the repository should be private.
 * @returns {Promise<{localPath: string, remoteUrl: string}>} - An object containing the local path and the remote URL of the created repository.
 */
async function createAndPublishRepo(repoName, localPath, description = '', isPrivate = false) {
    const GITHUB_API_BASE_URL = 'api.github.com';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    let owner = process.env.ORGANISATION_NAME;
    let gitEmail = process.env.GITHUB_EMAIL;
    if (!GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN environment variable is not set.");
    }

    // 1. Create remote repository on GitHub
    const apiUrl = `https://${GITHUB_API_BASE_URL}${owner ? `/orgs/${owner}/repos` : `/user/repos`}`;
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'NodeJS',
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
            name: repoName,
            description: description,
            private: isPrivate,
        })
    });

    if (!response.ok || response.status !== 201) {
        const errorData = await response.text();
        throw new Error(`GitHub API responded with status ${response.status}: ${errorData}`);
    }

    const repoData = await response.json();
    const remoteUrl = repoData.clone_url;
    const remoteUrlWithToken = remoteUrl.replace('https://github.com/', `https://${GITHUB_TOKEN}@github.com/`);

    // 2. Initialize local repository
    try {
        // Check if the path exists.
        await fsPromises.access(localPath);
    } catch (e) {
        await fsPromises.mkdir(localPath, { recursive: true });
    }

    await execAsync(`git init`, { cwd: localPath });
    await fsPromises.writeFile(path.join(localPath, 'README.md'), `# ${repoName}\n\n${description}`);
    await execAsync(`git add .`, { cwd: localPath });
    await execAsync(`git -c user.name="${gitEmail.split('@')[0]}" -c user.email="${gitEmail}" commit -m "Initial commit" `, { cwd: localPath });
    await execAsync(`git branch -M main`, { cwd: localPath });

    // 3. Link local to remote and push
    await execAsync(`git remote add origin "${remoteUrlWithToken}"`, { cwd: localPath });
    await execAsync(`git push -u origin main`, { cwd: localPath });

    return { localPath, remoteUrl };
}

/**
 * Stages all changes, commits them with a message, and pushes to the remote repository.
 * @param {string} repoPath - The local path of the Git repository.
 * @param {string} commitMessage - The commit message.
 * @returns {Promise<{message: string}>} - A confirmation message.
 */
async function commitAndPush(repoPath, commitMessage) {
    const gitEmail = process.env.GITHUB_EMAIL;
    if (!gitEmail) {
        throw new Error("GITHUB_EMAIL environment variable is not set.");
    }

    try {
        await fsPromises.access(path.join(repoPath, '.git'));
    } catch (e) {
        throw new Error("The specified path is not a Git repository.");
    }

    const { stdout: status } = await execAsync(`git status --porcelain`, { cwd: repoPath });
    if (!status) {
        console.log("No changes to commit.");
        return { message: "No changes to commit." };
    }

    await execAsync(`git add .`, { cwd: repoPath });
    await execAsync(`git -c user.name="${gitEmail.split('@')[0]}" -c user.email="${gitEmail}" commit -m "${commitMessage}"`, { cwd: repoPath });
    await execAsync(`git push`, { cwd: repoPath });
    return { message: "Committed and pushed successfully." };
}

/**
 * Pulls the latest changes from the remote repository.
 * @param {string} repoPath - The local path of the Git repository.
 * @returns {Promise<{stdout: string}>} - The stdout from the pull command.
 */
async function pull(repoPath) {
    const gitEmail = process.env.GITHUB_EMAIL;
    if (!gitEmail) {
        throw new Error("GITHUB_EMAIL environment variable is not set.");
    }

    try {
        await fsPromises.access(path.join(repoPath, '.git'));
    } catch (e) {
        throw new Error("The specified path is not a Git repository.");
    }

    const { stdout } = await execAsync(`git -c user.name="${gitEmail.split('@')[0]}" -c user.email="${gitEmail}" pull`, { cwd: repoPath });
    return { stdout };
}

/**
 * Deletes a repository from both the remote (GitHub) and the local filesystem.
 * @param {string} appName - The name of the repository to delete.
 * @returns {Promise<void>}
 */
async function deleteAppRepo(appName) {
    let owner = process.env.ORGANISATION_NAME;
    const appPath = path.join(process.env.SERVERLESS_ROOT_FOLDER, "applications", appName);
    try {
        await fsPromises.access(appPath);
    } catch (e) {
        throw new Error(`The specified app: ${appPath} does not exist.`);
    }
    const GITHUB_API_BASE_URL = 'api.github.com';
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

    if (!GITHUB_TOKEN) {
        throw new Error("GITHUB_TOKEN environment variable is not set.");
    }
    if (!owner) {
        throw new Error("Repository owner is required.");
    }

    // 1. Delete remote repository on GitHub
    const apiUrl = `https://${GITHUB_API_BASE_URL}/repos/${owner}/${appName}`;
    const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'User-Agent': 'NodeJS',
            'Accept': 'application/vnd.github.v3+json',
        },
    });

    if (response.status === 204) {
        // Deletion successful
    } else if (response.status === 404) {
        console.warn(`Remote repository ${owner}/${appName} not found. It might have been already deleted.`);
    } else if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`GitHub API responded with status ${response.status} while deleting: ${errorData}`);
    }

    // 2. Delete local repository folder
    try {
        await fsPromises.rm(appPath, { recursive: true, force: true });
    } catch (e) {
        if (e.code !== 'ENOENT') {
            throw e;
        }
    }
}

/**
 * Gets the status of a Git repository, categorizing files into added, modified, and deleted.
 * This function parses the output of `git status --porcelain` to determine the state of each file.
 * @param {string} repoPath - The local path of the Git repository.
 * @returns {Promise<{added: string[], modified: string[], deleted: string[]}>} - An object containing arrays of file paths for each category.
 */
async function getRepoStatus(repoPath) {
    try {
        await fsPromises.access(path.join(repoPath, '.git'));
    } catch (e) {
        throw new Error("The specified path is not a Git repository.");
    }

    const { stdout } = await execAsync(`git status --porcelain`, { cwd: repoPath });

    const statusMap = new Map();

    if (!stdout) {
        return { added: [], modified: [], deleted: [] };
    }

    const lines = stdout.trim().split('\n').filter(line => line);

    for (let line of lines) {
        line = line.trim();
        const status = line.substring(0, 2);
        const filePath = line.substring(2);

        if (status.startsWith('R')) {
            const [oldPath, newPath] = filePath.split(' -> ');
            statusMap.set(oldPath, 'D'); // A rename is a delete and an add
            statusMap.set(newPath, 'A');
        } else {
            const currentStatus = statusMap.get(filePath) || '';
            // We concatenate statuses for the same file, e.g., 'D' and '??' become 'D??'
            statusMap.set(filePath, currentStatus + status.trim());
        }
    }

    const added = [];
    const modified = [];
    const deleted = [];

    for (const [file, statuses] of statusMap.entries()) {
        // A file staged for deletion ('D') that is now untracked ('??') is a modification.
        if (statuses.includes('D') && statuses.includes('??')) {
            modified.push(file);
        } else if (statuses.includes('D')) { // A file that is deleted (either from index or work tree)
            deleted.push(file);
        } else if (statuses.includes('A') || statuses.includes('??')) { // A new file (added to index or untracked)
            added.push(file);
        } else if (statuses.includes('M')) { // A modified file
            modified.push(file);
        }
    }

    return { added, modified, deleted };
}

module.exports = {
    clone,
    getLastCommitDate,
    checkForUpdates,
    updateRepo,
    installDependencies,
    uninstallDependencies,
    createAndPublishRepo,
    commitAndPush,
    deleteAppRepo,
    getRepoStatus,
    pull
};
