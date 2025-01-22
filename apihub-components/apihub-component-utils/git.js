const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);
const fs = require("fs");
const path = require("path");

async function clone(repository, folderPath) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error("GITHUB_TOKEN is not set in environment variables.");
    }

    const authenticatedRepo = repository.replace(
        "https://github.com/",
        `https://${token}@github.com/`
    );

    await execAsync(`git clone ${authenticatedRepo} ${folderPath}`);
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
    const remoteUrlWithToken = token
        ? remoteUrl.replace("https://github.com/", `https://${token}@github.com/`)
        : remoteUrl;

    try {
        const { stdout: currentRemoteUrl } = await execAsync(`git -C ${localPath} remote get-url origin`);
        if (currentRemoteUrl.trim() !== remoteUrl && currentRemoteUrl.trim() !== remoteUrlWithToken) {
            throw new Error(`Remote URL mismatch. Expected: ${remoteUrl} or ${remoteUrlWithToken}, Found: ${currentRemoteUrl.trim()}`);
        }

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
async function installDependencies(dependencies) {
    try {
        if(!dependencies) {
            return;
        }
        const parentDir = `${process.cwd()}/..`;
        for(let dependency of dependencies) {
            await execAsync(`npm install ${dependency}`, {
                cwd: parentDir, // Set the working directory
            });
        }
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
module.exports = {
    clone,
    getLastCommitDate,
    checkForUpdates,
    updateRepo,
    installDependencies,
    uninstallDependencies
};
