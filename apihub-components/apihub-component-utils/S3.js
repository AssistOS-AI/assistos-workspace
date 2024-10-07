const fetch = require('node-fetch');
const config = require('../../data-volume/config/config.json');
const { Readable } = require('stream');
const llmAdapterUrl = config.LLMS_SERVER_DEVELOPMENT_BASE_URL;

const llmAdapterRoutes = {
    DELETE: {
        IMAGE: '/apis/v1/image',
        AUDIO: '/apis/v1/audio',
        VIDEO: '/apis/v1/video'
    },
    GET: {
        UPLOAD_URL: '/apis/v1/uploads',
        DOWNLOAD_URL: '/apis/v1/downloads',
        IMAGE: '/apis/v1/image',
        AUDIO: '/apis/v1/audio',
        VIDEO: '/apis/v1/video',
    },
    POST: {
        IMAGE: '/apis/v1/image',
        AUDIO: '/apis/v1/audio',
        VIDEO: '/apis/v1/video',
    },
    PUT: {},
};

function getRouteKey(tableId) {
    const mapping = {
        images: 'IMAGE',
        audios: 'AUDIO',
        videos: 'VIDEO',
    };
   return mapping[tableId.toLowerCase()];
}

async function sendLLMAdapterRequest(url, method, body = null, headers = {}) {
    const options = {
        method: method,
        headers: headers,
    };
    if (body) {
        options.body = body;
    }
    const response = await fetch(url, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    return response;
}

function getS3FileName(spaceId, tableId, objectId) {
    return `${spaceId}/${tableId}/${objectId}`;
}

async function headObject(spaceId, tableId, objectId) {
    const fileName = getS3FileName(spaceId, tableId, objectId);
    const routeKey = getRouteKey(tableId);
    const route = llmAdapterRoutes.GET[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const response = await sendLLMAdapterRequest(url, 'HEAD');

    return response.status === 200;
}


async function putObject(spaceId, tableId, objectId, request, contentType) {
    const fileName = getS3FileName(spaceId, tableId, objectId);
    const routeKey = getRouteKey(tableId);
    const route = llmAdapterRoutes.POST[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const headers = {
        'Content-Type': contentType
    };
    const stream = Readable.from(request);
    const response = await sendLLMAdapterRequest(url, 'POST', stream, headers);

    return response.status === 200;
}

async function deleteObject(spaceId, tableId, objectId) {
    const fileName = getS3FileName(spaceId, tableId, objectId);
    const routeKey = getRouteKey(tableId);
    const route = llmAdapterRoutes.DELETE[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const response = await sendLLMAdapterRequest(url, 'DELETE');

    return response.status === 200;
}


async function getObjectStream(spaceId, tableId, objectId,  headers = {}) {
    const fileName = getS3FileName(spaceId, tableId, objectId);
    const routeKey = getRouteKey(tableId);
    const route = llmAdapterRoutes.GET[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const response = await sendLLMAdapterRequest(url, 'GET', null, headers);
    /* response.headers is as instance of Headers class, and not a normal object that can be further passed to another response headers
    * without processing
    * */
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });
    return { fileStream: response.body, headers: responseHeaders };
}


async function getAudio(spaceId, audioId, range) {
    const headers = {};
    if (range) {
        headers['Range'] = range;
    }
    return await getObjectStream(spaceId, 'audios', audioId, headers);
}

async function getImage(spaceId, imageId, range) {
    const headers = {};
    if (range) {
        headers['Range'] = range;
    }
    return await getObjectStream(spaceId, 'images', imageId, headers);
}

async function getVideo(spaceId, videoId, range) {
    const headers = {};
    if (range) {
        headers['Range'] = range;
    }
    return await getObjectStream(spaceId, 'videos', videoId, headers);
}

async function putImage(spaceId, imageId, request) {
    return putObject(spaceId, 'images', imageId, request, 'image/png');
}

async function putAudio(spaceId, audioId, request) {
    return putObject(spaceId, 'audios', audioId, request, 'audio/mp3');
}

async function putVideo(spaceId, videoId, request) {
    return putObject(spaceId, 'videos', videoId, request, 'video/mp4');
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

async function headAudio(spaceId, audioId) {
    return headObject(spaceId, 'audios', audioId);
}

async function headVideo(spaceId, videoId) {
    return headObject(spaceId, 'videos', videoId);
}

async function headImage(spaceId, imageId) {
    return headObject(spaceId, 'images', imageId);
}

async function getUploadURL(spaceId, uploadType, fileId) {
    const response = await sendLLMAdapterRequest(`${llmAdapterUrl}${llmAdapterRoutes.GET.UPLOAD_URL}?spaceId=${spaceId}&uploadType=${uploadType}&fileId=${fileId}`, 'GET');
    return (await response.json()).data;
}

async function getDownloadURL(spaceId, downloadType, fileId) {
    const response = await sendLLMAdapterRequest(`${llmAdapterUrl}${llmAdapterRoutes.GET.DOWNLOAD_URL}?spaceId=${spaceId}&downloadType=${downloadType}&fileId=${fileId}`, 'GET');
    return (await response.json()).data;
}

module.exports = {
    putImage,
    putVideo,
    putAudio,
    getAudio,
    getImage,
    getVideo,
    deleteImage,
    deleteAudio,
    deleteVideo,
    headAudio,
    headVideo,
    headImage,
    getUploadURL,
    getDownloadURL
};
