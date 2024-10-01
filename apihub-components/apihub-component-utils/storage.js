
const config= require("../../data-volume/config/config.json");

const storageClient = config.S3 ? require('./S3.js') : require('./fileSys.js');

async function insertImage(spaceId, fileId, imageData) {
    return await storageClient.insertImage(spaceId, fileId, imageData);
}
async function insertVideo(spaceId, fileId, videoData) {
    return await storageClient.insertVideo(spaceId, fileId, videoData);
}
async function insertAudio(spaceId, fileId, audioData) {
    return await storageClient.insertAudio(spaceId, fileId, audioData);
}
async function getImage(spaceId, fileId) {
    return await storageClient.getImage(spaceId, fileId);
}
async function getVideo(spaceId, fileId) {
    return await storageClient.getVideo(spaceId, fileId);
}
async function getVideoRange(spaceId, fileId, range) {
    return await storageClient.getVideoRange(spaceId, fileId, range);
}
async function getAudio(spaceId, fileId) {
    return await storageClient.getAudio(spaceId, fileId);
}
function getImageStream(spaceId, fileId) {
    return storageClient.getImageStream(spaceId, fileId);
}
function getVideoStream(spaceId, fileId) {
    return storageClient.getVideoStream(spaceId, fileId);
}
function getAudioStream(spaceId, fileId) {
    return storageClient.getAudioStream(spaceId, fileId);
}
async function deleteImage(spaceId, fileId) {
    return await storageClient.deleteImage(spaceId, fileId);
}
async function deleteVideo(spaceId, fileId) {
    return await storageClient.deleteVideo(spaceId, fileId);
}
async function deleteAudio(spaceId, fileId) {
    return await storageClient.deleteAudio(spaceId, fileId);
}
async function headAudio(spaceId, fileId) {
    return await storageClient.headAudio(spaceId, fileId);
}
async function headVideo(spaceId, fileId) {
    return await storageClient.headVideo(spaceId, fileId);
}
async function headImage(spaceId, fileId) {
    return await storageClient.headImage(spaceId, fileId);
}
module.exports = {
    insertImage,
    insertAudio,
    insertVideo,
    getImage,
    getAudio,
    getVideo,
    getImageStream,
    getAudioStream,
    getVideoStream,
    deleteImage,
    deleteAudio,
    deleteVideo,
    headAudio,
    headVideo,
    headImage,
    getVideoRange
}
