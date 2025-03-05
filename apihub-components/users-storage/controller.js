const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');
const User = require('./user.js');
const configs= require('../../data-volume/config/config.json')
const Space = require("../spaces-storage/space");
async function registerUser(request, response) {
    const userData = request.body;
    if (!userData.password) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "Password is required"
        });
    }
    try {
        const verificationToken = await User.registerUser(
            userData.email,
            userData.password,
            userData.imageId,
            userData.inviteToken);
        utils.sendResponse(response, 200, "application/json", {
            message: `User ${userData.name} registered successfully. Please check your email for the verification code`,
            data:{verificationToken}
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            message: error.message
        });
    }
}

async function activateUser(request, response) {
    const activationToken = request.query['activationToken'];
    if (!activationToken) {
        return utils.sendResponse(response, 400, "application/json", {
            message: "No activation token provided."
        });
    }
    try {
        await User.activateUser(activationToken);
        if(configs.ENABLE_EMAIL_SERVICE){
            const activationSuccessHTML = await User.getActivationSuccessHTML();
            await utils.sendFileToClient(response, activationSuccessHTML, "html",200)
        }else{
            return utils.sendResponse(response, 200, "application/json", {
                message: ""
            });
        }

    } catch (error) {
        if(configs.ENABLE_EMAIL_SERVICE){
            const activationFailHTML = await User.getActivationFailHTML(error.message);
            await utils.sendFileToClient(response, activationFailHTML, "html",400)
        }else{
            return utils.sendResponse(response, 400, "application/json", {
                message: ""
            });
        }
    }
}

function parseCookies(cookies) {
    let parsedCookies = {};
    let cookieSplit = cookies.split(',');
    cookieSplit.forEach(function (cookie) {
        const parts = cookie.split('=');
        let name = parts.shift().trim();
        parsedCookies[name] = {};
        cookie.split(';').forEach(function (values) {
            const parts = values.split('=');
            let key = parts.shift().trim();
            if(key === name){
                parsedCookies[name].value = decodeURIComponent(parts.join('='));
            } else {
                parsedCookies[name][key] = decodeURIComponent(parts.join('='));
            }
        });
    });
    return parsedCookies;
}
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
        if(createSpace){
            let spaceName = email.split('@')[0];
            const space = await Space.APIs.createSpace(spaceName, email);
            cookies += cookie.createCurrentSpaceCookie(space.id);
        }
        response.setHeader('Set-Cookie', cookies);
        utils.sendResponse(response, 200, "application/json", {});
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            message: error.message
        });
    }
}

async function loadUser(request, response) {
    try {
        const userId = request.userId
        const userData = await User.getUserData(userId);
        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            message: `User ${userData.name} loaded successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        }, [cookie.createCurrentSpaceCookie(), cookie.createAuthCookie()]);
    }
}

async function logoutUser(request, response) {
        try {
        const userId = request.userId;
        await User.logoutUser(userId);
        utils.sendResponse(response, 200, "application/json", {
            message: "User logged out successfully"
        }, [cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            message: error.message
        });
    }
}

async function getUserAvatar(request, response) {
    const userId = request.params.userId;
    const user = await User.getUserFile(userId);
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
    const userId = request.params.userId;
    const imageId = request.body.imageId;
    try {
        const user = await User.getUserFile(userId);
        user.imageId = imageId;
        await User.updateUserFile(user.id, user);
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
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser,
    getUserAvatar,
    updateUserImage
};
