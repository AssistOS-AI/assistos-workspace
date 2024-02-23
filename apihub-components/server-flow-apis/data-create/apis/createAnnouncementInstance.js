function createAnnouncementInstance(announcementObject) {
    const {Announcement} = require('../../data-models/exporter.js')('Announcement');
    return new Announcement(announcementObject);
}

module.exports = createAnnouncementInstance
