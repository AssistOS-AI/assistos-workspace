async function createSpace(spaceName, userId, apiKey) {

    const path = require('path');
    const fsPromises = require('fs').promises;

    const {
        generateId,
        createDefaultAnnouncement,
        templateReplacer_$$,
        getCurrentUTCDate,
        validateOpenAIKey,
        maskOpenAIKey
    } =
        require('../exporter.js')('generateId', 'createDefaultAnnouncement', 'templateReplacer_$$', 'getCurrentUTCDate', 'validateOpenAIKey', 'maskOpenAIKey');

    const spaceTemplate = require('../../models/templates/exporter.js')('default-space','default-apikey');

    const spaceId = generateId();

    const spaceObj = templateReplacer_$$(spaceTemplate, {
            spaceName: spaceName,
            spaceId: spaceId,
            adminId: userId,
            apiKey: maskOpenAIKey(apiKey),
            defaultAnnouncement: createDefaultAnnouncement(spaceName),
            creationDate: getCurrentUTCDate()
        })
    ;

    const spacePath = path.join(__dirname, `../../../apihub-root/spaces/${spaceId}`);

    try {
        await fsPromises.access(spacePath);
        const error = new Error('Space already exists');
        error.statusCode = 409;
        throw error;
    } catch (e) {
        if (e.code === 'ENOENT') {
            await fsPromises.mkdir(spacePath);
            return spaceObj
        } else {
            throw e;
        }
    }

}

module.exports = createSpace;