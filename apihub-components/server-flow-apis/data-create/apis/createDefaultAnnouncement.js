function createDefaultAnnouncement(spaceId, spaceName) {
    const {getCurrentUTCDate,templateReplacer_$$}= require('../../data-utils/exporter.js')('getCurrentUTCDate','templateReplacer_$$');
    const spaceConstants=require('../../data-constants/exporter.js')('space-constants');

    const defaultAnnouncement=spaceConstants.DEFAULT_ANNOUNCEMENT.stringify()
    const date = getCurrentUTCDate();
    return templateReplacer_$$(defaultAnnouncement,
        {
            spaceId:spaceId,
            spaceName:spaceName,
            date:date
        }
    )
}

createDefaultAnnouncement();
module.exports = createDefaultAnnouncement
