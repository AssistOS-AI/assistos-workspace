const utils = require('../apihub-component-utils/utils.js');
const User = require('./user.js');
const Space = require("../space/space");

async function loadUser(request, response) {
    try {
        const userData = await User.loadUser(request.email, request.authKey);
        let spaceMap = await Space.APIs.getSpaceMap();
        let spaces = [];
        for(let spaceId of userData.spaces){
            if(spaceMap[spaceId]){
                spaces.push({id: spaceId, name: spaceMap[spaceId]});
            }
        }
        userData.spaces = spaces;
        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            message: `User ${userData.name} loaded successfully`
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function getUserImage(request, response) {
    const email = request.params.email;
    const user = await User.loadUser(email, request.authKey);
    const SecurityContext = require("assistos").ServerSideSecurityContext;
    let securityContext = new SecurityContext(request);
    const spaceModule = require("assistos").loadModule("space", securityContext);
    try {
        let image = await spaceModule.getImage(user.imageId);
        utils.sendResponse(response, 200, "image/png", image);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            message: e.message
        });
    }

}
async function updateUserImage(request, response) {
    const email = request.params.email;
    const imageId = request.body.imageId;
    try {
        await User.updateUserImage(email, imageId, request.authKey);
        utils.sendResponse(response, 200, "application/json", {
            message: "User image updated successfully"
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}
async function getCurrentSpaceId(request, response) {
    try {
        const spaceId = await User.getCurrentSpaceId(request.email, request.authKey);
        utils.sendResponse(response, 200, "application/json", {
            data: spaceId
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}
module.exports = {
    loadUser,
    getUserImage,
    updateUserImage,
    getCurrentSpaceId
};
