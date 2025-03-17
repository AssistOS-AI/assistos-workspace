const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');
const User = require('./user.js');
const Space = require("../spaces-storage/space");

async function loginUser(request, response) {
    const {email, code, createSpace} = request.body;
    try {
        const BASE_URL= process.env.BASE_URL;
        let internalResponse = await fetch(`${BASE_URL}/auth/walletLogin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email, code})
        });
        let responseData = await internalResponse.json();
        if(responseData.operation !== "success"){
            return utils.sendResponse(response, 400, "application/json", {
                message: responseData.message
            });
        }
        let cookies = internalResponse.headers.get('set-cookie');
        let cookieArray = cookies.split(',');
        if(createSpace){
            let spaceName = email.split('@')[0];
            let parsedCookies = cookie.parseResponseCookies(internalResponse);
            const space = await Space.APIs.createSpace(spaceName, email, encodeURIComponent(parsedCookies['authKey'].value));
            cookieArray.push(cookie.createCurrentSpaceCookie(space.id));
        }
        response.setHeader('Set-Cookie', cookieArray);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function loadUser(request, response) {
    try {
        const userData = await User.loadUser(request.email, request.authKey);
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

async function logoutUser(request, response) {
        try {
            await User.logoutUser(request.email, request.authKey);
        utils.sendResponse(response, 200, "application/json", {
            message: "User logged out successfully"
        }, [cookie.deleteCurrentSpaceCookie()]);
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
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
module.exports = {
    loginUser,
    loadUser,
    logoutUser,
    getUserImage,
    updateUserImage
};
