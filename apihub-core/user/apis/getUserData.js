const {getUserFile, getSpacesMap} = require('../../exporter.js')
('getUserFile', 'getSpacesMap');

async function getUserData(userId) {
    const userFile = JSON.parse(await getUserFile(userId));
    const spacesMap = await getSpacesMap();
    userFile.spaces = userFile.spaces.map(space => {
        return {
            name: spacesMap[space],
            id: space
        };
    });
    return userFile;
}

module.exports = getUserData;