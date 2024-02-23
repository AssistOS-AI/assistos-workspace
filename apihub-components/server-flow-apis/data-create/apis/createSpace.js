export async function createSpace(spaceName){
    const space={};

    const generateId = require('../../data-utils/exporter.js')('generateId');
    const createDefaultAnnouncement = require('../exporter.js')('createDefaultAnnouncement');

    space.defaultAnnouncement=createDefaultAnnouncement(generateId(),spaceName);

}