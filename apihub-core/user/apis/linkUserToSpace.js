const {
    getSpaceStatusObject,
    getCurrentUTCDate,
    updateSpaceStatus
} = require('../../exporter.js')
('getSpaceStatusObject', 'getCurrentUTCDate', 'updateSpaceStatus')

async function linkUserToSpace(spaceId, userId, role) {
    const spaceStatusObject = await getSpaceStatusObject(spaceId);
    if (!spaceStatusObject.users || !Array.isArray(spaceStatusObject.users)) {
        const error = new Error(`Corrupted Space file for Space: ${spaceStatusObject.name}`);
        error.statusCode = 500;
        throw error;
    }
    if (!spaceStatusObject.users.find(user => user.userId === userId)) {
        spaceStatusObject.users.push(
            {
                userId: userId,
                role: role,
                joinDate: getCurrentUTCDate()
            }
        )
    } else {
        const error = new Error(`User is already member of the Space: ${spaceStatusObject.name}`);
        error.statusCode = 409
        throw error
    }
    await updateSpaceStatus(spaceId, spaceStatusObject);
}

module.exports = linkUserToSpace
