const config = require("../../data-volume/config/config.json");

const storageClient = config.S3 ? require('./S3.js') : require('./fileSys.js');

async function putImage(spaceId, fileId, request) {
    return await storageClient.putImage(spaceId, fileId, request);
}
async function putVideo(spaceId, fileId, request) {
    return await storageClient.putVideo(spaceId, fileId, request);
}
async function putAudio(spaceId, fileId, request) {
    return await storageClient.putAudio(spaceId, fileId, request);
}
async function getImage(spaceId, fileId,range) {
    return await storageClient.getImage(spaceId, fileId,range);
}
async function getVideo(spaceId, fileId,range) {
    return await storageClient.getVideo(spaceId, fileId,range);
}
async function getAudio(spaceId, fileId,range) {
    return await storageClient.getAudio(spaceId, fileId,range);
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
async function getUploadURL(spaceId,uploadType,fileId){
    return await storageClient.getUploadURL(spaceId,uploadType,fileId);
}
async function getDownloadURL(spaceId,downloadType,fileId){
    return await storageClient.getDownloadURL(spaceId,downloadType,fileId);
}
module.exports = {
    putImage,
    putVideo,
    putAudio,
    getImage,
    getAudio,
    getVideo,
    deleteImage,
    deleteAudio,
    deleteVideo,
    headAudio,
    headVideo,
    headImage,
    getUploadURL,
    getDownloadURL,
}
