const path = require("path");
const fsPromises = require("fs/promises");
const volumeManager = require('../volumeManager.js');
const fs = require("fs");
const { Readable } = require('stream');
const { pipeline } = require('stream');
const util = require('util');
const pipe = util.promisify(pipeline);
const fileTypes = Object.freeze({
    "audio/mp3": {
            dir: "audios",
            extension: "mp3"
        },
    "image/png": {
            dir: "images",
            extension: "png"
        },
    "video/mp4": {
            dir: "videos",
            extension: "mp4"
        },
    }
)

async function downloadData(url, dest) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }
    const file = fs.createWriteStream(dest);
    try {
        // Pipe the response body into the file
        await pipe(response.body, file);
    } catch (err) {
        fs.unlink(dest, () => {});  // Clean up the file in case of error
        throw err;
    }
}

function getFilePath(type, fileId) {
    if(!fileTypes[type]){
        path.join(volumeManager.paths.assets, type, `${fileId}.txt`);
    }
    let extension = fileTypes[type].extension;
    return path.join(volumeManager.paths.assets, fileTypes[type].dir, `${fileId}.${extension}`);
}

function isReadableStream(obj) {
    return obj instanceof Readable && typeof obj._read === 'function';
}

function putFile(type, fileId, stream) {
    return new Promise((resolve, reject) => {
        if (!isReadableStream(stream)) {
            stream = Readable.from([JSON.stringify(stream)]);
        }
        const filePath = getFilePath(type, fileId);
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        writeStream.on('finish', () => {
            resolve(fileId);
        });
        writeStream.on('error', (err) => {
            reject(err);
        });
    });
}

async function getFiles(type) {
    const filesPath = path.join(volumeManager.paths.assets, type);
    const files = await fsPromises.readdir(filesPath);
    return files.map(file => file.split(".")[0]);
}

async function deleteFile(type, fileId) {
    const filePath = getFilePath(type, fileId);
    await fsPromises.rm(filePath);
}
async function getFileRange(filePath, range, defaultChunkSize = 1024 * 1024 * 3) {
    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : start + defaultChunkSize;
        const validEnd = Math.min(end, fileSize - 1);
        return {start, end: validEnd, fileSize};
    }
    return {start: 0, end: fileSize - 1, fileSize};
}
async function getFile(type, filePath, range) {
    filePath = path.join(volumeManager.paths.assets, decodeURIComponent(filePath));
    const {start, end, fileSize} = await getFileRange(filePath, range);

    let contentType;
    if(fileTypes[type]){
        contentType = fileTypes[type].contentType;
    } else {
        contentType = "text/plain";
    }
    const fileStream = fs.createReadStream(filePath, {start, end});
    const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end - start) + 1,
        'Content-Type': contentType,
    };
    return {fileStream, headers};
}

async function headFile(type, fileId) {
    const filePath = getFilePath(type, fileId);
    return await fsPromises.stat(filePath);
}

async function getUploadURL(type, fileId) {
    const baseURL = volumeManager.getBaseURL();
    return `${baseURL}/spaces/files/${fileId}`;
}

async function getDownloadURL(type, fileId) {
    const baseURL = volumeManager.getBaseURL();
    let filePath;
    if(fileTypes[type]){
        filePath = `${fileTypes[type].dir}/${fileId}.${fileTypes[type].extension}`;
    } else {
        filePath = `${fileId}.txt`;
    }
    return `${baseURL}/spaces/files/${encodeURIComponent(filePath)}`;
}

module.exports = {
    putFile,
    getFile,
    deleteFile,
    getFiles,
    headFile,
    downloadData,
    getUploadURL,
    getDownloadURL,
}
