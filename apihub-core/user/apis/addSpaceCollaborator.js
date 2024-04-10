const {
    linkSpaceToUser,
    linkUserToSpace,
    unlinkSpaceFromUser,
} = require('../../exporter.js')
('linkSpaceToUser', 'linkUserToSpace','unlinkSpaceFromUser');

async function addSpaceCollaborator(spaceId, userId, role) {
    await linkSpaceToUser(userId, spaceId)
    try {
        await linkUserToSpace(spaceId, userId, role)
    } catch (error) {
        await unlinkSpaceFromUser(userId, spaceId);
        throw error;
    }
}
module.exports=addSpaceCollaborator;