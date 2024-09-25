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
        await User.APIs.resetPassword(email, password,code);
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
        await User.APIs.sendPasswordResetCode(email);
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
        await User.APIs.addSecret(request.params.spaceId, request.userId, request.body);
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
        await User.APIs.deleteSecret(request.params.spaceId, request.userId, request.body);
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
        const booleanResult = await User.APIs.userSecretExists(request.params.spaceId, request.userId, request.body);
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
        await User.APIs.registerUser(
            userData.email,
            userData.password,
            userData.photo,
            userData.inviteToken);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            message: `User ${userData.name} registered successfully. Please check your email for the verification code`
        });
    } catch (error) {
        utils.sendResponse(response, error.statusCode, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function activateUser(request, response) {

    const queryParams = utils.extractQueryParams(request);
    const activationToken = queryParams['activationToken'];
    if (!activationToken) {
        return utils.sendResponse(response, 400, "application/json", {
            success: false,
            message: "No activation token provided."
        });
    }
    try {
        await User.APIs.activateUser(activationToken);
        const activationSuccessHTML = await User.APIs.getActivationSuccessHTML();
        await utils.sendFileToClient(response, activationSuccessHTML, "html")
    } catch (error) {
        const activationFailHTML = await User.APIs.getActivationFailHTML(error.message);
        await utils.sendFileToClient(response, activationFailHTML, "html")
    }
}

async function loginUser(request, response) {
    const requestData = request.body;
    try {
        console.log("-----BEFORE LOGIN USER-----");
        const {userId} = await User.APIs.loginUser(requestData.email, requestData.password);
        console.log("-----AFTER LOGIN USER-----");
        const userData = await User.APIs.getUserData(userId);
        console.log("-----AFTER getUserData-----");
        utils.sendResponse(response, 200, "application/json", {
            data: userData,
            success: true,
            message: `User ${userData.name} logged in successfully`
        }, [await cookie.createAuthCookie(userData), await cookie.createRefreshAuthCookie(userData), cookie.createCurrentSpaceCookie(userData.currentSpaceId)]);
    } catch (error) {
        utils.sendResponse(response, error.statusCode||500, "application/json", {
            success: false,
            message: error.message
        });
    }
}

async function loadUser(request, response) {
    try {
        const userId = request.userId
        const userData = await User.APIs.getUserData(userId);
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
        await User.APIs.logoutUser(userId);
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
    const user = await User.APIs.getUserFile(userId);
    const base64Data = user.photo.split(",")[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    utils.setCacheControl(response, {
        maxAge: 60 * 60 * 24 * 7,
        public: true
    });
    utils.sendResponse(response, 200, "image/png", imageBuffer);

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