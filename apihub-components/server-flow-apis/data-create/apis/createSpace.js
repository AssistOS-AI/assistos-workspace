export async function createSpace(spaceName){
    const spaceObj={};

    const generateId = require('../../data-utils/exporter.js')('generateId');
    const createDefaultAnnouncement = require('../exporter.js')('createDefaultAnnouncement');

    spaceObj.announcemenets=spaceObj.announcements = [createDefaultAnnouncement(spaceName)];
    spaceObj.documents=[];
    spaceObj.id=generateId();
}