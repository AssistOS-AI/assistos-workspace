const fs = require('fs');
const path = require('path');

function exporter(...functionNames) {
    const apiDirectoryPath = path.join(__dirname, 'apis');

    if (functionNames.length === 1) {
        const functionName = functionNames[0];
        const filePath = path.join(apiDirectoryPath, `${functionName}.js`);
        if (fs.existsSync(filePath)) {
            return require(filePath);
        } else {
            throw new Error(`Function "${functionName}" not found.`);
        }
    }

    const apis = {};
    if (functionNames.length > 1) {
        functionNames.forEach(functionName => {
            const filePath = path.join(apiDirectoryPath, `${functionName}.js`);
            if (fs.existsSync(filePath)) {
                apis[functionName] = require(filePath);
            } else {
                throw new Error(`Function "${functionName}" not found.`);
            }
        });
    } else {
        const files = fs.readdirSync(apiDirectoryPath);
        files.forEach(file => {
            if (path.extname(file) === '.js') {
                const moduleName = path.basename(file, '.js');
                apis[moduleName] = require(path.join(apiDirectoryPath, file));
            }
        });
    }

    return apis;
}

module.exports = exporter;
