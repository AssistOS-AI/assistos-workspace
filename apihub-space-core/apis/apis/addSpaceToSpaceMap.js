const path = require('path');
const fsPromises = require('fs').promises;

const {
    SPACE_MAP_PATH,
} = require('../../config.json');

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

module.exports = addSpaceToSpaceMap;