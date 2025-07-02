const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);
const fs = require("fs");
const path = require("path");
const https = require('https');
const { URL } = require('url');
function getGitHubToken(){
    let keys = JSON.parse(process.env.API_KEYS);
    return keys["GITHUB"];
}
async function checkGitHubRepoVisibility(repoUrl) {
    try {
        const url = new URL(repoUrl);
        let repoPath = url.pathname.replace(/^\/|\/$/g, ''); // Remove leading/trailing slashes

        if(repoPath.includes('.git')){
            repoPath = repoPath.replace('.git', '');
        }

        const options = {
            hostname: 'api.github.com',
            path: `/repos/${repoPath}`,
            method: 'GET',
            headers: {
                'User-Agent': 'NodeJS',
            },
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    if (res.statusCode === 200) {
                        const repoData = JSON.parse(data);
                        resolve(repoData.private ? 'Private' : 'Public');
                    } else if (res.statusCode === 404) {
                        reject(new Error('Repository not found or private'));
                    } else {
                        reject(new Error(`GitHub API responded with status code ${res.statusCode}`));
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

            req.end();
        });
    } catch (error) {
        throw error;
    }
}

async function clone(repository, folderPath) {

    let visibility;
    try {
        visibility = await checkGitHubRepoVisibility(repository);
        console.log(`The repository is ${visibility}`);
    } catch (error) {
        console.log(error);
    }

    if(!visibility || visibility === "Private") {
        const tokenObj = getGitHubToken();
        const token = tokenObj.APIKey;
        if (!token) {
            throw new Error("GitHub token not set");
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

    const tokenObj = getGitHubToken();
    const token = tokenObj.APIKey;
    if (!token) {
        return false;
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
