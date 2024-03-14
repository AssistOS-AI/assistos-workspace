function createDefaultAnnouncement(spaceName) {
    const {getCurrentUTCDate,templateReplacer_$$,generateId}= require('../exporter.js')('getCurrentUTCDate','templateReplacer_$$','generateId');
    const defaultSpaceAnnouncement=require('../../models/templates/exporter.js')('defaultSpaceAnnouncement');

    const date = getCurrentUTCDate();
    const announcementId=generateId();
    return templateReplacer_$$(defaultSpaceAnnouncement,
        {
            announcementId:announcementId,
            spaceName:spaceName,
            currentUTCDate:date
        })
}

module.exports = createDefaultAnnouncement
