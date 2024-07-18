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
                return sendResponse(response, 500, "text/plain", {
                    message: "File type not supported",
                    success: false
                });
        }
        sendResponse(response, 200, contentType, resource);
    } catch (error) {
        throw Error(error);
    }
}

function sendResponse(response, statusCode, contentType, message, cookies, ...headers) {
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    headers.forEach(header => {
        response.setHeader(header.key, header.value);
    });

    switch (contentType) {
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

function setCacheControl(response, options = {}) {
    let cacheControl = options.private ? 'private' : 'public';

    if (options.noStore) {
        cacheControl = 'no-store';
    } else {
        if (options.noCache) {
            cacheControl += ', no-cache';
        }
        if (options.mustRevalidate) {
            cacheControl += ', must-revalidate';
        }
        if (options.maxAge) {
            cacheControl += `, max-age=${options.maxAge}`;
        }
        if (options.sMaxAge) {
            cacheControl += `, s-maxage=${options.sMaxAge}`;
        }
    }

    response.setHeader('Cache-Control', cacheControl);
}


module.exports = {
    extractQueryParams,
    sendFileToClient,
    setCacheControl,
    sendResponse
}