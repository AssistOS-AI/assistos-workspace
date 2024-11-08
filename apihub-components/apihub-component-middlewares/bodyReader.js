function bodyReader(req, res, next) {
    const contentType = req.headers['content-type'];

    // Skip bodyReader for multipart/form-data to avoid overloading buffer with large files
    if (contentType && (contentType.startsWith('multipart/form-data') ||
        contentType.startsWith('video/') ||
        contentType.startsWith('audio/') ||
        contentType.startsWith('image/'))) {
        req.query = extractQueryParams(req);
        return next();
    }
    convertReadableStreamToBuffer(req, (error, bodyAsBuffer) => {
        if (error) {
            console.info(0x02, `Fail to convert Stream to Buffer!`, error.message);
            console.error("Fail to convert Stream to Buffer!", error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({message: "Fail to convert Stream to Buffer!" }));
            return;
        }
        if (req.method === "PUT" || req.method === "POST") {
            if (contentType.startsWith('application/json')) {
                try {
                    bodyAsBuffer = bodyAsBuffer.toString();
                    /* To allow PUT and POST requests with empty body */
                    if(bodyAsBuffer !== "") {
                        req.body = JSON.parse(bodyAsBuffer.toString());
                    }else{
                        req.body = {};
                    }
                } catch (error) {
                    console.error("Failed to parse JSON body!", error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        message: "Failed to parse JSON body!"
                    }));
                    return;
                }
            } else if (contentType.startsWith('application/octet-stream')) {
                req.body = bodyAsBuffer;
            } else {
                req.body = bodyAsBuffer.toString();
            }
        }
        req.query = extractQueryParams(req);

        next();
    });
}

function convertReadableStreamToBuffer(readStream, callback) {
    let buffers = [];

    readStream.on("data", (chunk) => buffers.push(chunk));

    readStream.on("error", (error) => callback(error));

    readStream.on("end", () => callback(undefined, Buffer.concat(buffers)));
}

function extractQueryParams(request) {
    const queryObject = new URL(request.url, `http://${request.headers.host}`).searchParams;
    let params = {};
    for (let [key, value] of queryObject.entries()) {
        if (value.includes(',')) {
            params[key] = value.split(',');
        }
        else if (!isNaN(value)) {
            params[key] = Number(value);
        }
        else {
            params[key] = value;
        }
    }
    return params;
}


module.exports = bodyReader;
