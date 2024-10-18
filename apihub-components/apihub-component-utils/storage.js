const config = require("../../data-volume/config/config.json");
const fileTypes= {
    images: "images",
    audios: "audios",
    videos: "videos"
}
const storageClient = config.S3 ? require('./S3.js') : require('./fileSys.js');

async function getFiles(spaceId, location){
    return await storageClient.getFiles(spaceId, location);
}
async function putFile(type, fileId, stream){
    return await storageClient.putFile(type, fileId, stream);
}
async function getFile(type, fileId, range){
    return await storageClient.getFile(type, fileId, range);
}
async function deleteFile(type, fileId){
    return await storageClient.deleteFile(type, fileId);
}
async function headFile(type, fileId){
    return await storageClient.headFile(type, fileId);
}
async function getUploadURL(type, fileId){
    return await storageClient.getUploadURL(type, fileId);
}
async function getDownloadURL(type, fileId){
    return await storageClient.getDownloadURL(type, fileId);
}
module.exports = {
    putFile,
    getFile,
    deleteFile,
    headFile,
    getUploadURL,
    getDownloadURL,
    fileTypes
}
