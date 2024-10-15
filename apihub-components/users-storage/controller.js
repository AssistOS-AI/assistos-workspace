const cookie = require('../apihub-component-utils/cookie.js');
const utils = require('../apihub-component-utils/utils.js');
const User = require('./user.js');

async function resetPassword(request,response){
    const email = request.body.email;
    const password = request.body.password;
    const code = request.body.code;
    if(!email || !password|| !code){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Email, password and code are required"
        });
    }
    try {
        await User.resetPassword(email, password,code);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Password reset successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode||500, "application/json", {
            success: false,
            message: error.message
        });
    }
}
async function sendPasswordResetCode(request,response){
    const email = request.body.email;
    if(!email){
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Email is required"
        });
    }
    try {
        await User.sendPasswordResetCode(email);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `Password reset code sent successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}
async function addSecret(request, response) {
    try {
        await User.addSecret(request.params.spaceId, request.userId, request.body);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: "Secret stored successfully"
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function deleteSecret(request, response) {
    try {
        await User.deleteSecret(request.params.spaceId, request.userId, request.body);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: "Secret deleted successfully"
        });
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function userSecretExists(request, response) {
    try {
        const booleanResult = await User.userSecretExists(request.params.spaceId, request.userId, request.body);
        utils.sendResponse(response, 200, "application/json", {
            data: booleanResult,
            success: true,
            message: "Secrets exist status loaded successfully"
        });
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: JSON.stringify(e)
        });
    }
}

async function registerUser(request, response) {
    const userData = request.body;
    if (!userData.password) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "Password is required"
        });
    }
    try {
        await User.registerUser(
            userData.email,
            userData.password,
            userData.photo,
            userData.inviteToken);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `User ${userData.name} registered successfully. Please check your email for the verification code`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function activateUser(request, response) {
    const activationToken = request.query['activationToken'];
    if (!activationToken) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "No activation token provided."
        });
    }
    try {
        await User.activateUser(activationToken);
        const activationSuccessHTML = await User.getActivationSuccessHTML();
        await utils.sendFileToClient(response, activationSuccessHTML, "html")
    } catch (error) {
        const activationFailHTML = await User.getActivationFailHTML(error.message);
        await utils.sendFileToClient(response, activationFailHTML, "html")
    }
}

async function loginUser(request, response) {
    const requestData = request.body;
    try {
        const {userId} = await User.loginUser(requestData.email, requestData.password);
        const userData = await User.getUserData(userId);

        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} logged in successfully`
        }, [await cookie.createAuthCookie(userData), await cookie.createRefreshAuthCookie(userData), cookie.createCurrentSpaceCookie(userData.currentSpaceId)]);
    } catch (error) {
        utils.sendResponse(response, error.statusCode || 500, "application/json", {
            success: false,
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
            success: true,
            message: `User ${userData.name} loaded successfully`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        }, [cookie.createCurrentSpaceCookie(), cookie.createAuthCookie()]);
    }
}

async function logoutUser(request, response) {
        try {
        const userId = request.userId;
        await User.logoutUser(userId);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: "User logged out successfully"
        }, [cookie.deleteAuthCookie(), cookie.deleteRefreshAuthCookie(), cookie.deleteCurrentSpaceCookie()]);
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
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
        let image = await spaceModule.getImage("", user.imageId);
        utils.sendResponse(response, 200, "image/png", image);
    } catch (e) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: e.message
        });
    }

}

module.exports = {
    addSecret,
    deleteSecret,
    userSecretExists,
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser,
    getUserAvatar,
    sendPasswordResetCode,
    resetPassword
};
