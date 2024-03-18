const {getSpaceStatusObject, updateSpaceStatus} = require('../exporter.js')
('getSpaceStatusObject', 'updateSpaceStatus')

async function addAnnouncement(spaceId, announcementObject) {
    const spaceStatusObject = getSpaceStatusObject(spaceId)
    spaceStatusObject.announcements.push(announcementObject)
    updateSpaceStatus(spaceStatusObject);
}

module.exports = addAnnouncement;
