function createDefaultAnnouncement(spaceName) {
    const {getCurrentUTCDate,templateReplacer_$$,generateId}= require('../../data-utils/exporter.js')('getCurrentUTCDate','templateReplacer_$$','generateId');
    const {DEFAULT_ANNOUNCEMENT_TEMPLATE}=require('../../data-constants/exporter.js')('space-constants');

    const date = getCurrentUTCDate();
    const announcementId=generateId();

    return templateReplacer_$$(DEFAULT_ANNOUNCEMENT_TEMPLATE,
        {
            announcementId:announcementId,
            spaceName:spaceName,
            currentUTCDate:date
        })
}

module.exports = createDefaultAnnouncement
