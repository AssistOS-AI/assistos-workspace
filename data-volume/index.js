const path = require('path');
const fsPromises = require('fs').promises;
const volumeConfigs = require('./config.json');

module.exports = {
    volumeConfigs: volumeConfigs,
    clean: async function () {
        const cleanDirectory = async (directoryPath) => {
            const fullPath = path.join(__dirname, directoryPath);
            const files = await fsPromises.readdir(fullPath, {withFileTypes: true});
            await Promise.all(files.map(async (file) => {
                const itemPath = path.join(fullPath, file.name);
                if (file.isDirectory()) {
                    await fsPromises.rm(itemPath, {recursive: true, force: true});
                } else {
                    await fsPromises.unlink(itemPath);
                }
            }));
        };

        const cleanJSON = async (filePath) => {
            const fullPath = path.join(__dirname, filePath);
            await fsPromises.writeFile(fullPath, JSON.stringify({}, null, 2));
        }

        const cleanSpaces = async () => {
            await cleanDirectory(volumeConfigs.SPACE_FOLDER_PATH);
        };

        const cleanUsers = async () => {
            await cleanDirectory(volumeConfigs.USER_FOLDER_PATH);
        };

        const cleanSpacesMap = async () => {
            await cleanJSON(volumeConfigs.SPACE_MAP_PATH);
        };

        const cleanUsersMap = async () => {
            await cleanJSON(volumeConfigs.USER_MAP_PATH);
        };

        const cleanUserCredentialsFile = async () => {
            await cleanJSON(volumeConfigs.USER_CREDENTIALS_PATH);
        };

        const cleanUserActivationFile = async () => {
            await cleanJSON(volumeConfigs.USER_PENDING_ACTIVATION_PATH);
        };

        await Promise.all([
            cleanSpaces(),
            cleanUsers(),
            cleanSpacesMap(),
            cleanUsersMap(),
            cleanUserCredentialsFile(),
            cleanUserActivationFile(),
        ]);
    }
};
