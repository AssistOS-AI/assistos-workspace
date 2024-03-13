const fs = require('fs');
const path = require('path');

function exporter(...classNames) {
    const apiDirectoryPath = path.join(__dirname, 'flows');
    if (classNames.length === 1) {
        const className = classNames[0];
        const filePath = path.join(apiDirectoryPath, `${className}.js`);
        if (fs.existsSync(filePath)) {
            return require(filePath);
        } else {
            throw new Error(`Class "${className}" not found.`);
        }
    }
    const classes = {};
    if (classNames.length > 1) {
        classNames.forEach(className => {
            const filePath = path.join(apiDirectoryPath, `${className}.js`);
            if (fs.existsSync(filePath)) {
                classes[className] = require(filePath);
            } else {
                throw new Error(`Class "${className}" not found.`);
            }
        });
    } else {
        const files = fs.readdirSync(apiDirectoryPath);
        files.forEach(file => {
            if (path.extname(file) === '.js') {
                const className = path.basename(file, '.js');
                classes[className] = require(path.join(apiDirectoryPath, file));
            }
        });
    }

    return classes;
}

module.exports = exporter;
