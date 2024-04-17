const utils = require('../apihub-component-utils/utils.js');
const cookie = require('../apihub-component-utils/cookie.js');

const Loader = require('../../assistOS-sdk/Loader.js');

const userModule = Loader.loadModule('user');
const spaceModule = Loader.loadModule('space');

const spaceAPIs = spaceModule.loadAPIs();


async function getObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectName = request.params.objectName;
    try {
        let object = await spaceAPIs.getObject(spaceId, objectType, objectName);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
            message: `Object ${objectType} loaded successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at loading object: ${objectType}: ${objectName}`
        });
    }
}

async function addObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectData = request.body;
    try {
        let object = await spaceAPIs.addObject(spaceId, objectType, objectData);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
            message: `Object ${objectType} added successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at adding object: ${objectType}`
        });
    }
}

async function updateObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectName = request.params.objectName;
    const objectData = request.body;
    try {
        let object = await spaceAPIs.updateObject(spaceId, objectType, objectName, objectData);
        return sendResponse(response, 200, "application/json", {
            success: true,
            data: object,
            message: `Object ${objectType} updated successfully`
        })
    } catch (e) {
        return sendResponse(response, 500, "application/json", {
            success: false,
            message: e + ` Error at updating object: ${objectType}: ${objectName}`
        });
    }

}

async function deleteObject(request, response) {
    const spaceId = request.params.spaceId;
    const objectType = request.params.objectType;
    const objectName = request.params.objectName;
    try {
        let objectId = await spaceAPIs.deleteObject(spaceId, objectType, objectName);
        return utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: objectId,
            message: `Object ${objectType} deleted successfully`
        });
    } catch (error) {
        return utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error + ` Error at deleting object: ${objectType}: ${objectName}`
        });
    }
}

/* TODO constant object mapping of content types to avoid writing manually the content type of a response
*   and move the cookie verification authentication, rights, etc in a middleware */
async function getSpace(request, response) {
    const userAPIs = userModule.loadAPIs();
    const spaceAPIs = spaceModule.loadAPIs();
    try {
        let spaceId;
        const userId = request.userId;
        if (request.params.spaceId) {
            spaceId = request.params.spaceId;
        } else if (cookie.parseCookies(request).currentSpaceId) {
            spaceId = cookie.parseCookies(request).currentSpaceId;
        } else {
            spaceId = userAPIs.getDefaultSpaceId(userId);
        }

        let spaceObject = await spaceAPIs.getSpaceStatusObject(spaceId);
        spaceObject["documents"] = await spaceAPIs.getSpaceDocumentsObject(spaceId);
        spaceObject["personalities"] = await spaceAPIs.getSpacePersonalitiesObject(spaceId);
        await userAPIs.updateUsersCurrentSpace(userId, spaceId);
        utils.sendResponse(response, 200, "application/json", {
            success: true,
            data: spaceObject,
            message: `Space ${spaceId} loaded successfully`
        }, cookie.createCurrentSpaceCookie(spaceId));
    } catch (error) {
        utils.sendResponse(response, 500, "application/json", {
            success: false,
            message: error
        });
    }
}

async function createSpace(request, response) {
    const userId = request.userId
    const spaceAPIs = spaceModule.loadAPIs();

    const spaceName = request.body.spaceName
    if (!spaceName) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Name is required",
            success: false
        });
        return;
    }

    const apiKey = request.headers.apikey;
    if (!apiKey) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: API Key is required",
            success: false
        });
        return;
    }

    try {
        let newSpace = await spaceAPIs.createSpace(spaceName, userId, apiKey);
        utils.sendResponse(response, 201, "application/json", {
            message: `Space created successfully: ${newSpace.id}`,
            data: newSpace,
            success: true
        }, cookie.createCurrentSpaceCookie(newSpace.id));
    } catch (error) {
        switch (error.statusCode) {
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: Space already exists",
                    success: false
                });
                return;
            case 401:
                utils.sendResponse(response, 401, "application/json", {
                    message: "Unauthorized: Invalid API Key",
                    success: false
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }
}

async function addCollaboratorToSpace(request, response) {
    /* Todo Check if the user has access to that space and has the right to add an user */
    const userId = request.userId
    const userAPIs = userModule.loadAPIs();

    const spaceId = request.body.spaceId;
    if (!spaceId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Space Id is required",
            success: false
        });
        return;
    }
    const collaboratorId = request.body.collaboratorId;
    if (!collaboratorId) {
        utils.sendResponse(response, 400, "application/json", {
            message: "Bad Request: Collaborator Id is required",
            success: false
        });
        return;
    }

    try {
        await userAPIs.addSpaceCollaborator(spaceId, collaboratorId);
        utils.sendResponse(response, 200, "application/json", {
            message: `Collaborator added successfully: ${collaboratorId}`,
            success: true
        });
    } catch (error) {
        switch (error.statusCode) {
            case 404:
                utils.sendResponse(response, 404, "application/json", {
                    message: "Not Found: Space not found",
                    success: false
                });
                return;
            case 409:
                utils.sendResponse(response, 409, "application/json", {
                    message: "Conflict: Collaborator already exists",
                    success: false
                });
                return;
            case 401:
                utils.sendResponse(response, 401, "application/json", {
                    message: "Unauthorized: Invalid Collaborator Id",
                    success: false
                });
                return;
        }
        utils.sendResponse(response, 500, "application/json", {
            message: `Internal Server Error: ${error}`,
            success: false
        });
    }

}



module.exports = {
    getObject,
    addObject,
    updateObject,
    deleteObject,
    getSpace,
    createSpace,
    addCollaboratorToSpace
}