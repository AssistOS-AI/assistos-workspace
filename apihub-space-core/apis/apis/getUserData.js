const {getUserFile,getSpacesMap}=require('../exporter.js')
('getUserFile','getSpacesMap');

async function getUserData(userId) {
    const userFile = JSON.parse(await getUserFile(userId));
    const spacesMap = await getSpacesMap();
    userFile.spaces.forEach(space => {
        space.name = spacesMap[space.id];
    });
    return userFile;
}
module.exports= getUserData;