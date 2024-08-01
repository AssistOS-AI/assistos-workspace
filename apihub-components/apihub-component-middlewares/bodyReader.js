function bodyReader(req, res, next) {
    convertReadableStreamToBuffer(req, (error, bodyAsBuffer) => {
        if (error) {
            console.info(0x02, `Fail to convert Stream to Buffer!`, error.message);
            console.error("Fail to convert Stream to Buffer!", error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end({success: false, message: "Fail to convert Stream to Buffer!"});
            return;
        }
        if(req.method === "PUT" || req.method === "POST"){
            const contentType = req.headers['content-type'];
            if (contentType.startsWith('application/json')) {
                try {
                    req.body = JSON.parse(bodyAsBuffer.toString());
                } catch (error) {
                    console.error("Failed to parse JSON body!", error.message);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end({
                        success: false,
                        message: "Failed to parse JSON body!" });
                    return;
                }
            } else if(contentType.startsWith('application/octet-stream')) {
                req.body = bodyAsBuffer;
            } else {
                req.body = bodyAsBuffer.toString();
            }
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
