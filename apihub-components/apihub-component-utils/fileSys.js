const path = require("path");
const fsPromises = require("fs/promises");
const volumeManager = require('../volumeManager.js');
const fs = require("fs");
const { Readable } = require('stream');
const { pipeline } = require('stream');
const util = require('util');
const pipe = util.promisify(pipeline);
const config = require("../../data-volume/config/config.json");

async function downloadData(url, dest) {
    if (config.S3 === false) {
        const baseURL = volumeManager.getBaseURL();
        url = `${baseURL}${url}`;
    }
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

function getFilePath(fileId) {
    return path.join(volumeManager.paths.assets, fileId);
}

function isReadableStream(obj) {
    return obj instanceof Readable && typeof obj._read === 'function';
}

function putFile(type, fileId, stream) {
    return new Promise((resolve, reject) => {
        if (!isReadableStream(stream)) {
            stream = Readable.from([JSON.stringify(stream)]);
        }
        const filePath = getFilePath(fileId);
        const metadataFilePath = `${filePath}.json`;
        const writeStream = fs.createWriteStream(filePath);
        stream.pipe(writeStream);
        writeStream.on('finish', async () => {
            await fsPromises.writeFile(metadataFilePath, JSON.stringify({type}));
            resolve(fileId);
        });
        writeStream.on('error', (err) => {
            reject(err);
        });
    });
}

async function deleteFile(type, fileId) {
    const filePath = getFilePath(fileId);
    await fsPromises.rm(filePath);
    await fsPromises.rm(`${filePath}.json`);
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

async function getFile(type, fileId, range) {
    let filePath = getFilePath(fileId);
    const {start, end, fileSize} = await getFileRange(filePath, range);

    let metadataFilePath = `${filePath}.json`;
    let metadata = await fsPromises.readFile(metadataFilePath, 'utf8');
    metadata = JSON.parse(metadata);
    const fileStream = fs.createReadStream(filePath, {start, end});
    const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end - start) + 1,
        'Content-Type': metadata.type,
    };
    return {fileStream, headers};
}

async function headFile(type, fileId) {
    const filePath = getFilePath(fileId);
    return await fsPromises.stat(filePath);
}

async function getUploadURL(type, fileId) {
    return `/spaces/files/${fileId}`;
}

async function getDownloadURL(type, fileId) {
    return `/spaces/files/${fileId}`;
}

module.exports = {
    putFile,
    getFile,
    deleteFile,
    headFile,
    downloadData,
    getUploadURL,
    getDownloadURL,
}
