const path = require("path");
const fsPromises = require("fs/promises");
const volumeManager = require('../volumeManager.js');
const fs = require("fs");
const https = require("https");
const { Readable } = require('stream');

const fileTypes = Object.freeze({
        audios: {
            contentType: "audio/mp3",
            extension: "mp3"
        },
        images: {
            contentType: "image/png",
            extension: "png"
        },
        videos: {
            contentType: "video/mp4",
            extension: "mp4"
        },
        json: {
            contentType: "application/json",
            extension: "json"
        }

    }
)

async function downloadData(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest);
            reject(err);
        });
    });
}

function getFilePath(relativeDir, fileId) {
    let extension = fileTypes[relativeDir].extension;
    return path.join(volumeManager.paths.assets, relativeDir, `${fileId}.${extension}`);
}

function isReadableStream(obj) {
    return obj instanceof Readable && typeof obj._read === 'function';
}

function putFile(relativeDir, fileId, stream) {
    return new Promise((resolve, reject) => {
        if (!isReadableStream(stream)) {
            stream = Readable.from([JSON.stringify(stream)]);
        }
        const filePath = getFilePath(relativeDir, fileId);
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

async function getFiles(relativeDir) {
    const filesPath = path.join(volumeManager.paths.assets, relativeDir);
    const files = await fsPromises.readdir(filesPath);
    return files.map(file => file.split(".")[0]);
}

async function deleteFile(relativeDir, fileId) {
    const filePath = getFilePath(relativeDir, fileId);
    await fsPromises.rm(filePath);
}

async function getFile(relativeDir, fileId, range) {
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

    if (!fileTypes[relativeDir]) {
        throw new Error(`Invalid file type: ${relativeDir}`);
    }
    const filePath = getFilePath(relativeDir, fileId);
    const {start, end, fileSize} = await getFileRange(filePath, range);

    const fileStream = fs.createReadStream(filePath, {start, end});
    const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end - start) + 1,
        'Content-Type': fileTypes[relativeDir].contentType,
    };
    return {fileStream, headers};
}

async function headFile(relativeDir, fileId) {
    const filePath = getFilePath(relativeDir, fileId);
    return await fsPromises.stat(filePath);
}

async function getUploadURL(uploadType, fileId) {
    const baseURL = volumeManager.getBaseURL();
    return `${baseURL}/spaces/${uploadType}/${fileId}`;
}

async function getDownloadURL(downloadType, fileId) {
    const baseURL = volumeManager.getBaseURL();
    return `${baseURL}/spaces/${downloadType}/${fileId}`;
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
