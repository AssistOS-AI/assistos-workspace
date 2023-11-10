const fsPromises = require('fs').promises;
const path = require('path');
function sendResponse(response,statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}
async function getDefaultItems(filePath) {
    let localData = [];
    const files = await fsPromises.readdir(filePath);

    const statPromises = files.map(async (file) => {
        const fullPath = path.join(filePath, file);
        const stat = await fsPromises.stat(fullPath);
        return { file, stat };
    });
    const fileStats = await Promise.all(statPromises);
    fileStats.sort((a, b) => a.stat.ctimeMs - b.stat.ctimeMs);
    for (const { file } of fileStats) {
        const jsonContent = await fsPromises.readFile(path.join(filePath, file), 'utf8');
        localData.push(JSON.parse(jsonContent));
    }
    return localData;
}
async function loadDefaultScripts(request, response){
    const filePath = `../apihub-root/default-scripts`;
    let data =  await getDefaultItems(filePath);
    sendResponse(response, 200, "text/html", JSON.stringify(data));
}
async function loadDefaultPersonalities(request,response){
    const filePath=`../apihub-root/default-personalities`;
    let data=await getDefaultItems(filePath);
    sendResponse(response,200,"text/html",JSON.stringify(data));
}
module.exports = {
    loadDefaultScripts,
    loadDefaultPersonalities
}