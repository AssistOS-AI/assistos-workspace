function createDefaultAnnouncement(spaceId, spaceName) {
    const getCurrentUTCDate= require('../../data-utils/exporter.js')('getCurrentUTCDate');
    const spaceConstants=require('../../data-constants/exporter.js')('space-constants');

    const defaultAnnouncement=spaceConstants.DEFAULT_ANNOUNCEMENT

    const date = getCurrentUTCDate();
}

createDefaultAnnouncement();
module.exports = createDefaultAnnouncement
