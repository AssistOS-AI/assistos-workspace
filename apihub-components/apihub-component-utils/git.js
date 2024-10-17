const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

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

module.exports = {
    clone,
    getLastCommitDate
};
