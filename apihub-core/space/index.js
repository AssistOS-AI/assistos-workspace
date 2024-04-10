async function addAnnouncement(spaceId, announcementObject) {
    const spaceStatusObject = getSpaceStatusObject(spaceId)
    spaceStatusObject.announcements.push(announcementObject)
    updateSpaceStatus(spaceStatusObject);
}
async function addSpaceToSpaceMap(spaceId, spaceName) {
    const spacesMapPath= path.join(__dirname, '../../../', SPACE_MAP_PATH);

    let spacesMapObject= JSON.parse(await fsPromises.readFile(spacesMapPath, 'utf8'));

    if(spacesMapObject.hasOwnProperty(spaceId)){
        throw new Error(`Space with id ${spaceId} already exists`);
    }else{
        spacesMapObject[spaceId] = spaceName;
    }
    await fsPromises.writeFile(spacesMapPath, JSON.stringify(spacesMapObject,null,2), 'utf8',{encoding:'utf8'});

}
async function copyDefaultFlows(spacePath) {
    const fsPromises = require('fs').promises;
    const path = require('path');

    const {DEFAULT_FLOWS_PATH} = require('../../../config.json');
    const createDirectory = require('../../exporter.js')('createDirectory');

    const flowsPath = path.join(spacePath, 'flows');

    await createDirectory(flowsPath);

    const filesPath = path.join(__dirname,'../../../',DEFAULT_FLOWS_PATH);
    const files = await fsPromises.readdir(filesPath);
    for (const file of files) {
        const filePath = path.join(filesPath, file);
        const destFilePath = path.join(flowsPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }
}
async function copyDefaultPersonalities(spacePath) {
    const fsPromises = require('fs').promises;
    const path = require('path');

    const {DEFAULT_PERSONALITIES_PATH} = require('../../../config.json');
    const createDirectory = require('../../exporter.js')('createDirectory');

    const personalitiesPath = path.join(spacePath, 'personalities');

    await createDirectory(personalitiesPath);

    const filesPath = path.join(__dirname,'../../../',DEFAULT_PERSONALITIES_PATH);
    const files = await fsPromises.readdir(filesPath);
    for (const file of files) {
        const filePath = path.join(filesPath, file);
        const destFilePath = path.join(personalitiesPath, file);
        await fsPromises.copyFile(filePath, destFilePath);
    }
}
function createDefaultAnnouncement(spaceName) {
    const date = getCurrentUTCDate();
    const announcementId = generateId();
    return templateReplacer_$$(defaultSpaceAnnouncement,
        {
            announcementId: announcementId,
            spaceName: spaceName,
            currentUTCDate: date
        })
}


