function bodyReader(req, res, next) {
    convertReadableStreamToBuffer(req, (error, bodyAsBuffer) => {
        if (error) {
            logger.info(0x02, `Fail to convert Stream to Buffer!`, error.message);
            logger.error("Fail to convert Stream to Buffer!", error.message);
            return res.send(500);
        }
        const contentType = req.headers['content-type'];
        if (contentType.startsWith('application/json')) {
            try {
                req.body = JSON.parse(bodyAsBuffer.toString());
            } catch (error) {
                return res.send(500);
            }
        } else if(contentType.startsWith('application/octet-stream')) {
            req.body = bodyAsBuffer;
        } else {
            req.body = bodyAsBuffer.toString();
        }
        next();
        });

}
function convertReadableStreamToBuffer(readStream, callback) {
    let buffers = [];

    readStream.on("data", (chunk) => buffers.push(chunk));

    readStream.on("error", (error) => callback(error));

    readStream.on("end", () => callback(undefined, $$.Buffer.concat(buffers)));
}

module.exports = bodyReader;
