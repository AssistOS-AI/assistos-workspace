const fetch = require('node-fetch');
const config = require('../../data-volume/config/config.json');

const llmAdapterUrl = config.LLMS_SERVER_DEVELOPMENT_BASE_URL;

const llmAdapterRoutes = {
    DELETE: {
        RECORD: '/apis/v1/record',
        IMAGE: '/apis/v1/image',
        AUDIO: '/apis/v1/audio',
        VIDEO: '/apis/v1/video'
    },
    GET: {
        UPLOAD_URL: '/apis/v1/upload-url',
        RECORD: '/apis/v1/record',
        IMAGE: '/apis/v1/image',
        AUDIO: '/apis/v1/audio',
        VIDEO: '/apis/v1/video',
        IMAGE_STREAM: '/apis/v1/image/stream',
        AUDIO_STREAM: '/apis/v1/audio/stream',
        VIDEO_STREAM: '/apis/v1/video/stream'
    },
    POST: {
        RECORD: '/apis/v1/record',
        IMAGE: '/apis/v1/image',
        AUDIO: '/apis/v1/audio',
        VIDEO: '/apis/v1/video',
    },
    PUT: {
        RECORD: '/apis/v1/record'
    },
};

// Function to map tableId to route keys
function getRouteKey(tableId, isStream = false) {
    const mapping = {
        images: 'IMAGE',
        audios: 'AUDIO',
        videos: 'VIDEO',
        records: 'RECORD'
    };
    let routeKey = mapping[tableId.toLowerCase()];
    if (isStream && routeKey) {
        routeKey += '_STREAM';
    }
    return routeKey;
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
    const routeKey = getRouteKey(tableId, false);
    const route = llmAdapterRoutes.GET[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const response = await sendLLMAdapterRequest(url, 'HEAD');

    return response.status === 200;
}
async function getObject(spaceId, tableId, objectId, headers = {}) {
    const fileName = getS3FileName(spaceId, tableId, objectId);
    const routeKey = getRouteKey(tableId, false);
    const route = llmAdapterRoutes.GET[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const response = await sendLLMAdapterRequest(url, 'GET', null, headers);

    const data = await response.buffer();
    return data;
}

async function insertObject(spaceId, tableId, objectId, objectData,contentType) {
    const fileName = getS3FileName(spaceId, tableId, objectId);
    const routeKey = getRouteKey(tableId);
    const route = llmAdapterRoutes.POST[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const headers = {
        'Content-Type': contentType
    };

    const response = await sendLLMAdapterRequest(url, 'POST', objectData, headers);

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

async function getImage(spaceId, imageId) {
    return getObject(spaceId, 'images', imageId);
}

async function getAudio(spaceId, audioId) {
    return getObject(spaceId, 'audios', audioId);
}

async function getVideo(spaceId, videoId) {
    return getObject(spaceId, 'videos', videoId);
}
async function getVideoRange(spaceId, videoId, range) {
    const fileName = getS3FileName(spaceId, "videos", videoId);
    const routeKey = getRouteKey("videos", true);
    const route = llmAdapterRoutes.GET[routeKey];
    const url = `${llmAdapterUrl}${route}?fileName=${encodeURIComponent(fileName)}`;

    const response = await sendLLMAdapterRequest(url, 'GET', null, {
        Range: range
    });

    let head = {
        'Content-Range': response.headers.get('Content-Range'),
        'Accept-Ranges': 'bytes',
        'Content-Length': response.headers.get('Content-Length'),
        'Content-Type': response.headers.get('Content-Type')
    };
    return {fileStream: response.body, head};
}

async function insertImage(spaceId, imageId, imageData) {
    return insertObject(spaceId, 'images', imageId, imageData,'image/png');
}

async function insertAudio(spaceId, audioId, audioData) {
    return insertObject(spaceId, 'audios', audioId, audioData,'audio/mp3');
}

async function insertVideo(spaceId, videoId, videoData) {
    return insertObject(spaceId, 'videos', videoId, videoData,'video/mp4');
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
async function getUploadURL(spaceId){
    return await sendLLMAdapterRequest(`${llmAdapterUrl}${llmAdapterRoutes.GET.UPLOAD_URL}?spaceId=${spaceId}`, 'GET');
}

module.exports = {
    insertImage,
    insertAudio,
    insertVideo,
    getAudio,
    getImage,
    getVideo,
    getVideoRange,
    deleteImage,
    deleteAudio,
    deleteVideo,
    headAudio,
    headVideo,
    headImage,
    getUploadURL
};
