const fetch = require('node-fetch');
const config = require('../../data-volume/config/config.json');
let llmAdapterUrl = config.LLMS_SERVER_DEVELOPMENT_BASE_URL;
if(config.ENVIRONMENT_MODE === 'production'){
    llmAdapterUrl = config.LLMS_SERVER_PRODUCTION_BASE_URL;
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

async function headFile(type, fileId) {
    const url = `${llmAdapterUrl}/apis/v1/storage?type=${encodeURIComponent(type)}&fileId=${encodeURIComponent(fileId)}`;
    const response = await sendLLMAdapterRequest(url, 'HEAD');
    return {
        size: parseInt(response.headers.get('Content-Length')),
        mtime: new Date(response.headers.get('Last-Modified'))
    }
}

async function putFile(type, fileId, stream) {
    const url = `${llmAdapterUrl}/apis/v1/storage?type=${encodeURIComponent(type)}&fileId=${encodeURIComponent(fileId)}`;
    const response = await sendLLMAdapterRequest(url, 'PUT', stream, {'Content-Type': 'application/octet-stream'});
    return response.status === 200;
}

async function deleteFile(type, fileId) {
    const url = `${llmAdapterUrl}/apis/v1/storage?type=${encodeURIComponent(type)}&fileId=${encodeURIComponent(fileId)}`;
    const response = await sendLLMAdapterRequest(url, 'DELETE');
    return response.status === 200;
}

async function getFile(type, fileId, range) {
    const url = `${llmAdapterUrl}/apis/v1/storage?type=${encodeURIComponent(type)}&fileId=${encodeURIComponent(fileId)}`;
    let headers = {};
    if (range) {
        headers['Range'] = range;
    }
    const response = await sendLLMAdapterRequest(url, 'GET', null, headers);
    /* response.headers is as instance of Headers class, and not a normal object that can be further passed to another response headers
    * without processing
    * */
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });
    return {fileStream: response.body, headers: responseHeaders};
}

async function getUploadURL(type, fileId) {
    const response = await sendLLMAdapterRequest(`${llmAdapterUrl}/apis/v1/uploads?type=${encodeURIComponent(type)}&fileId=${encodeURIComponent(fileId)}`, 'GET');
    let url = (await response.json()).data;
    return {
        uploadURL: url,
        externalRequest: true
    }
}

async function getDownloadURL(type, fileId) {
    const response = await sendLLMAdapterRequest(`${llmAdapterUrl}/apis/v1/downloads?type=${encodeURIComponent(type)}&fileId=${encodeURIComponent(fileId)}`, 'GET');
    let url = (await response.json()).data;
    return {
        downloadURL: url,
        externalRequest: true
    }
}

module.exports = {
    putFile,
    getFile,
    deleteFile,
    headFile,
    getUploadURL,
    getDownloadURL
};
