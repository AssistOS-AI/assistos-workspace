async function createSpace(spaceName) {
    const {generateId,createDefaultAnnouncement,templateReplacer_$$,getCurrentUTCDate} =
        require('../exporter.js')('generateId','createDefaultAnnouncement','templateReplacer_$$','getCurrentUTCDate');
    const spaceTemplate = require('../../models/templates/exporter.js')('default-space');
    const spaceObj = templateReplacer_$$(spaceTemplate, {
        spaceName: spaceName,
        spaceId: generateId(),
        defaultAnnouncement: createDefaultAnnouncement(spaceName),
        creationDate:getCurrentUTCDate()
    });
    console.log(spaceObj);
    console.log(spaceObj.announcements);
}
module.exports=createSpace;