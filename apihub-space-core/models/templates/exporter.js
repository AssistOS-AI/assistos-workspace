const fs = require('fs');
const path = require('path');

function exporter(...jsonFileNames) {
    const directoryPath = path.join(__dirname);

    if (jsonFileNames.length === 1) {
        const jsonFileName = jsonFileNames[0];
        const filePath = path.join(directoryPath, `${jsonFileName}.json`);
        if (fs.existsSync(filePath)) {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(fileContents);
        } else {
            throw new Error(`JSON file "${jsonFileName}" not found.`);
        }
    }

    const jsonFiles = {};
    if (jsonFileNames.length > 1) {
        jsonFileNames.forEach(jsonFileName => {
            const filePath = path.join(directoryPath, `${jsonFileName}.json`);
            if (fs.existsSync(filePath)) {
                const fileContents = fs.readFileSync(filePath, 'utf8');
                jsonFiles[jsonFileName] = JSON.parse(fileContents);
            } else {
                throw new Error(`JSON file "${jsonFileName}" not found.`);
            }
        });
    } else {
        const files = fs.readdirSync(directoryPath);
        files.forEach(file => {
            if (path.extname(file) === '.json') {
                const fileName = path.basename(file, '.json');
                const filePath = path.join(directoryPath, file);
                const fileContents = fs.readFileSync(filePath, 'utf8');
                jsonFiles[fileName] = JSON.parse(fileContents);
            }
        });
    }

    return jsonFiles;
}

module.exports = exporter;
