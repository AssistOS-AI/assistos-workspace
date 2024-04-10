function bodyReader(req, res, next) {
    const data = [];

    req.on('data', (chunk) => {
        data.push(chunk);
    });

    req.on('end', () => {
        const rawData = Buffer.concat(data).toString();
        try {
            req.body = JSON.parse(rawData);
        } catch (error) {
            req.body = rawData;
        }
        next();
    });
}
module.exports=bodyReader;