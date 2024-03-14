async function createDirectory(directoryPath) {
    const fsPromises = require('fs').promises;
    try {
        await fsPromises.access(directoryPath);
        const error = new Error('Directory already exists');
        error.statusCode = 409;
        throw error;
    } catch (e) {
        if (e.code === 'ENOENT') {
            await fsPromises.mkdir(directoryPath);
        } else {
            throw e;
        }
    }
}
module.exports=createDirectory