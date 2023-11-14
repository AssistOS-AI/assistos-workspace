const fsPromises = require('fs').promises;
async function saveJSON(response, spaceData, filePath) {
    try {
        await fsPromises.writeFile(filePath, spaceData, 'utf8');
    } catch(error) {
        sendResponse(response, 500, "text/html", error+ ` Error at writing space: ${filePath}`);
        return "";
    }
}

function sendResponse(response,statusCode, contentType, message){
    response.statusCode = statusCode;
    response.setHeader("Content-Type", contentType);
    response.write(message);
    response.end();
}
async function storeUser(request, response) {
    const filePath = `../apihub-root/users/${request.params.userId}.json`;
    let userData = request.body.toString();
    if(userData === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.userId}`);
        return "";
    }
    let jsonData = JSON.parse(userData);
    await saveJSON(response, JSON.stringify(jsonData), filePath);
    let message = {id:jsonData.id, secretToken:jsonData.secretToken, spaces:jsonData.spaces, currentSpaceId: jsonData.currentSpaceId};
    sendResponse(response, 200, "application/json", JSON.stringify(message));
    return "";

}
async function loadUser(request, response) {
    const filePath = `../apihub-root/users/${request.params.userId}.json`;
    let data;
    try {
        data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
    } catch (error) {
        sendResponse(response, 404, "text/html", error+ ` Error user not found: ${filePath}`);
        return "";
    }
    sendResponse(response, 200, "text/html", data);
    return "";
}

async function loadUserByEmail(request, response) {
    let email =request.body.toString();
    let users = [];

    for (let item of await fsPromises.readdir("../apihub-root/users")){
        let result = await fsPromises.readFile(`../apihub-root/users/${item}`);
        users.push(JSON.parse(result));
    }

    let user = users.find(user => user.email === email);
    if(user){
        sendResponse(response, 200, "application/json", JSON.stringify(user));
        return "";
    }

    sendResponse(response, 404, "text/html", "User not found");
    return "";
}

module.exports = {
    storeUser,
    loadUser,
    loadUserByEmail
};