const fs = require('fs');
const path = require('path');
const directoriesToCreate = [
    "spaces",
    "Temp",
    "assets",
];
const mainDir = "data-volume";
const filesToCreate = [
    "[MAP]Spaces.json",
    "SpacesPendingInvitations.json",
];
(async () => {
    try {
        await Promise.all(directoriesToCreate.map(async dir => {
            let dirPath = path.join(__dirname, mainDir, dir);
            try {
                await fs.promises.access(dirPath);
            } catch (error) {
                await fs.promises.mkdir(dirPath,{recursive: true});
                console.log(`Created dir: ${dirPath}`);
            }
        }));
        await Promise.all(filesToCreate.map(async file => {
            let filePath = path.join(__dirname, mainDir, file);
            try{
                await fs.promises.access(filePath);
            }catch (e) {
                await fs.promises.writeFile(filePath, "{}");
                console.log(`Created file: ${file}`);
            }
        }));
    } catch (e) {
        console.error("AOS setup failed: " + e);
    }
})();

