const SPACE_CONSTANTS = require('../../constants/exporter.js')('space-constants');
const documentAPIs = require('../../document/apis/document.js');
async function addObject(spaceId, objectType, objectData) {
    if(!SPACE_CONSTANTS.OBJECT_TYPES[objectType]){
        throw new Error(`Invalid object type: ${objectType}`);
    }
    if(!documentAPIs[SPACE_CONSTANTS.OBJECT_TYPES[objectType]]["add"]){
        throw new Error(`No ADD API found for object type: ${objectType}`);
    }
    return await documentAPIs[SPACE_CONSTANTS.OBJECT_TYPES[objectType]]["add"](spaceId, objectData);
}
async function updateObject() {

}
async function deleteObject() {

}
module.exports = {
    addObject,
    updateObject,
    deleteObject
};