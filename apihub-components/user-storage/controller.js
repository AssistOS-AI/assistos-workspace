const { sendResponse, saveJSON } = require("../space-storage/controller");
const fsPromises = require('fs').promises;
async function storeUser(request, response) {
    const filePath = `../apihub-root/users/${request.params.userId}.json`;
    if(request.body.toString() === "") {
        await fsPromises.unlink(filePath);
        sendResponse(response, 200, "text/html", `Deleted successfully ${request.params.userId}`);
        return "";
    }
    let jsonData = JSON.parse(request.body.toString());
    await saveJSON(response, JSON.stringify(jsonData), filePath);
    sendResponse(response, 200, "text/html", `Success, ${request.body.toString()}`);
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

    let user = users.find(user => user.email = email);
    if(user){
        sendResponse(response, 200, "text/html", JSON.stringify(user));
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