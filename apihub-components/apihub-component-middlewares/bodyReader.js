const fs = require('fs');
const path = require('path');
const crypto=require('../apihub-component-utils/crypto.js');

function bodyReader(req, res, next) {
    const data = [];

    req.on('data', (chunk) => {
        data.push(chunk);
    });

    req.on('end', () => {
        const contentType = req.headers['content-type'];
        if (contentType && contentType.startsWith('multipart/form-data')) {
            const boundary = contentType.split('boundary=')[1];
            const body = Buffer.concat(data);
            const parts = body.toString('binary').split(`--${boundary}`);

            parts.forEach(part => {
                if (part.indexOf('Content-Disposition') !== -1) {
                    const start = part.indexOf('\r\n\r\n') + 4;
                    const end = part.lastIndexOf('\r\n');
                    const fileContent = part.slice(start, end);
                    const fileId=crypto.generateSecret(64);
                    const uploadPath = path.join(__dirname, '../../data-volume/Temp', `${fileId}.aos`);
                    fs.writeFileSync(uploadPath, Buffer.from(fileContent, 'binary'));
                    req.fileId=fileId;
                    req.filePath = uploadPath;
                }
            });
        } else {
            try {
                req.body = JSON.parse(Buffer.concat(data).toString());
            } catch (error) {
                req.body = Buffer.concat(data).toString();
            }
        }
        next();
    });

    req.on('error', (err) => {
        console.error(err);
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('An error occurred');
    });
}

module.exports = bodyReader;
