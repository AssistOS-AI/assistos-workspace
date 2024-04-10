const fs = require('fs');
const path = require('path');

function htmlexporter(...htmlFileNames) {
    const directoryPath = path.join(__dirname);

    if (htmlFileNames.length === 1) {
        const htmlFileName = htmlFileNames[0];
        const filePath = path.join(directoryPath, `${htmlFileName}.html`);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        } else {
            throw new Error(`HTML file "${htmlFileName}" not found.`);
        }
    }

    const htmlFiles = {};
    if (htmlFileNames.length > 1) {
        htmlFileNames.forEach(htmlFileName => {
            const filePath = path.join(directoryPath, `${htmlFileName}.html`);
            if (fs.existsSync(filePath)) {
                htmlFiles[htmlFileName] = fs.readFileSync(filePath, 'utf8');
            } else {
                throw new Error(`HTML file "${htmlFileName}" not found.`);
            }
        });
    } else {
        const files = fs.readdirSync(directoryPath);
        files.forEach(file => {
            if (path.extname(file) === '.html') {
                const fileName = path.basename(file, '.html');
                const filePath = path.join(directoryPath, file);
                htmlFiles[fileName] = fs.readFileSync(filePath, 'utf8');
            }
        });
    }

    return htmlFiles;
}

module.exports = htmlexporter;
