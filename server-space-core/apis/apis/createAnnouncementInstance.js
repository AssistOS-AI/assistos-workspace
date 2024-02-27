function createAnnouncementInstance(announcementObject) {
    const {Announcement} = require('../server-space-models/exporter.js')('Announcement');
    return new Announcement(announcementObject);
}

module.exports = createAnnouncementInstance
