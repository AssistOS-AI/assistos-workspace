function createDefaultAnnouncement(spaceId, spaceName) {
    const {getCurrentUTCDate,templateReplacer_$$}= require('../../data-utils/exporter.js')('getCurrentUTCDate','templateReplacer_$$');
    const spaceConstants=require('../../data-constants/exporter.js')('space-constants');

    const defaultAnnouncement=spaceConstants.DEFAULT_ANNOUNCEMENT
    const date = getCurrentUTCDate();
    return templateReplacer_$$(defaultAnnouncement,
        {
            spaceId:spaceId,
            spaceName:spaceName,
            currentUTCDate:date
        })
}

module.exports = createDefaultAnnouncement
