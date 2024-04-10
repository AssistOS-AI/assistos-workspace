const fsPromises=require('fs').promises

function extractQueryParams(request) {
    const queryObject = new URL(request.url, `http://${request.headers.host}`).searchParams;
    let params = {};
    for (let [key, value] of queryObject.entries()) {
        params[key] = value;
    }
    return params;
}
async function sendFileToClient(response, resource, fileType) {
    try {
        let contentType = "";
        switch (fileType) {
            case "js":
                contentType = "application/javascript";
                break;
            case "html":
                contentType = "text/html";
                break;
            case "css":
                contentType = "text/css";
                break;
            case"png":
                contentType = "image/png";
                break;
            case"jpg":
                contentType = "image/jpg";
                break;
            case "jpeg":
                contentType = "image/jpeg";
                break;
            case "svg":
                contentType = "image/svg+xml";
                break;
            case "gif":
                contentType = "image/gif";
                break;
            case "ico":
                contentType = "image/x-icon";
                break;
            case "json":
                contentType = "application/json";
                break;
            case "woff":
                contentType = "font/woff";
                break;
            default:
                return sendResponse(response, 500, "text/plain", "Internal Server Error, file type not supported");
        }
        sendResponse(response, 200, contentType, resource);
    } catch (error) {
        throw Error(error);
    }
}
function sendResponse(response, statusCode, contentType, message, cookies) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);

    switch(contentType) {
        case 'application/json':
            message = JSON.stringify(message);
            break;
    }

    if (cookies) {
        const cookiesArray = Array.isArray(cookies) ? cookies : [cookies];
        response.setHeader('Set-Cookie', cookiesArray);
    }

    response.write(message);
    response.end();
}
module.exports={
    extractQueryParams,
    sendFileToClient,
    sendResponse
}