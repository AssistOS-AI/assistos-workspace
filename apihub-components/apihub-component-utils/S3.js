function getS3FileName(spaceId, tableId, objectId) {
    return `${spaceId}/${tableId}/${objectId}`;
}

async function getObject(spaceId, tableId, objectId) {
    const fileName = getS3FileName(spaceId, tableId, objectId);

}

async function insertObject(spaceId, tableId, objectId, objectData) {
    const fileName = getS3FileName(spaceId, tableId, objectId);

}

async function deleteObject(spaceId, tableId, objectId) {
    const fileName = getS3FileName(spaceId, tableId, objectId);

}

async function getImage(spaceId, imageId) {
    return getObject(spaceId, 'images', imageId);
}

async function getAudio(spaceId, audioId) {
    return getObject(spaceId, 'audios', audioId);
}

async function getVideo(spaceId, videoId) {
    return getObject(spaceId, 'videos', videoId);
}

async function insertImage(spaceId, imageId, imageData) {
    return insertObject(spaceId, 'images', imageId, imageData);
}

async function insertAudio(spaceId, audioId, audioData) {
    return insertObject(spaceId, 'audios', audioId, audioData);
}

async function insertVideo(spaceId, videoId, videoData) {
    return insertObject(spaceId, 'videos', videoId, videoData);
}

async function deleteImage(spaceId, imageId) {
    return deleteObject(spaceId, 'images', imageId);
}

async function deleteAudio(spaceId, audioId) {
    return deleteObject(spaceId, 'audios', audioId);
}

async function deleteVideo(spaceId, videoId) {
    return deleteObject(spaceId, 'videos', videoId);
}

module.exports = {
    insertImage,
    insertAudio,
    insertVideo,
    getAudio,
    getImage,
    getVideo,
    deleteImage,
    deleteAudio,
    deleteVideo
};
