const path = require('path');
const fsPromises = require('fs').promises;
const {
    generateId,
    createDefaultAnnouncement,
    templateReplacer_$$,
    getCurrentUTCDate,
    createDirectory,
    maskOpenAIKey,
    validateData,
    copyDefaultFlows,
    copyDefaultPersonalities,
    createSpaceStatus,
    linkSpaceToUser,
} = require('../exporter.js')
('generateId', 'createDefaultAnnouncement', 'templateReplacer_$$', 'getCurrentUTCDate', 'createDirectory', 'maskOpenAIKey', 'validateData', 'copyDefaultFlows', 'copyDefaultPersonalities', 'createSpaceStatus', 'linkSpaceToUser');

const {
    defaultSpaceTemplate,
    defaultApiKeyTemplate,
    defaultSpaceAgent
} = require('../../models/templates/exporter.js')
('defaultSpaceTemplate', 'defaultApiKeyTemplate', 'defaultSpaceAgent');

const spaceValidationSchema = require('../../models/validation-schemas/exporter.js')
('spaceValidationSchema');

const {SPACE_FOLDER_PATH} = require('../../config.json');

const rollback = async (spacePath) => {
    try {
        await fsPromises.rm(spacePath, {recursive: true, force: true});
    } catch (error) {
        console.error(`Failed to clean up space directory at ${spacePath}: ${error}`);
        throw error;
    }
};
async function createSpace(spaceName, userId, apiKey) {
    const spaceId = generateId();
    let spaceObj = {}
    try {
        spaceObj = templateReplacer_$$(defaultSpaceTemplate, {
            spaceName: spaceName,
            spaceId: spaceId,
            adminId: userId,
            apiKey: apiKey?templateReplacer_$$(defaultApiKeyTemplate, {
                keyType: "OpenAI",
                ownerId: userId,
                keyId: generateId(),
                keyValue: maskOpenAIKey(apiKey)
            }):undefined,
            spaceAgent: defaultSpaceAgent,
            defaultAnnouncement: createDefaultAnnouncement(spaceName),
            creationDate: getCurrentUTCDate()
        });
    } catch (error) {
        error.message = 'Error creating space';
        error.statusCode = 500;
        throw error;
    }
    let spaceValidationResult = {};
    try {
        spaceValidationResult = validateData(spaceValidationSchema, spaceObj);
    } catch (error) {
        error.message = 'Error validating space data';
        error.statusCode = 500;
        throw error;
    }
    if (spaceValidationResult.status === false) {
        const error = new Error(spaceValidationResult.errorMessage);
        error.statusCode = 400;
        throw error;
    }

    const spacePath = path.join(__dirname, '../../../', `${SPACE_FOLDER_PATH}`, `${spaceId}`);

    await createDirectory(spacePath);

    const filesPromises = [
        () => copyDefaultFlows(spacePath),
        () => copyDefaultPersonalities(spacePath),
        () => createDirectory(path.join(spacePath, 'documents')),
        () => createDirectory(path.join(spacePath, 'applications')),
        () => createSpaceStatus(spacePath, spaceObj),
        () => linkSpaceToUser(userId, spaceId),
    ];

    const results = await Promise.allSettled(filesPromises.map(fn => fn()));
    const failed = results.filter(r => r.status === 'rejected');

    if (failed.length > 0) {
        await rollback(spacePath);
        const error = new Error(failed.map(op => op.reason?.message || 'Unknown error').join(', '));
        error.statusCode = 500;
        throw error;
    }
    return spaceObj;
}

module.exports = createSpace;