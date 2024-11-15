const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);
const fs = require("fs");
const path = require("path");

async function clone(repository, folderPath) {
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

    try {
        const { stdout: currentRemoteUrl } = await execAsync(`git -C ${localPath} remote get-url origin`);
        if (currentRemoteUrl.trim() !== remoteUrl) {
            throw new Error(`Remote URL mismatch. Expected: ${remoteUrl}, Found: ${currentRemoteUrl.trim()}`);
        }

        await execAsync(`git -C ${localPath} fetch`);

        const { stdout: branchStdout } = await execAsync(`git -C ${localPath} rev-parse --abbrev-ref HEAD`);
        const branch = branchStdout.trim();

        const { stdout: localCommit } = await execAsync(`git -C ${localPath} rev-parse ${branch}`);

        const { stdout: remoteCommit } = await execAsync(`git -C ${localPath} rev-parse origin/${branch}`);

        if (localCommit.trim() === remoteCommit.trim()) {
            return false
        } else {
            return true
        }
    } catch (error) {
        throw new Error(`Failed to check for updates: ${error.message}`);
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
module.exports = {
    clone,
    getLastCommitDate,
    checkForUpdates,
    updateRepo
};
