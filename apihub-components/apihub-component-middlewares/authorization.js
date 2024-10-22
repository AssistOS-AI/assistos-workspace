const Space=require('../spaces-storage/space.js');
const utils = require('../apihub-component-utils/utils.js');
const secrets = require("../apihub-component-utils/secrets");

async function authorization(req, res, next){
    const userId = req.userId;
    const spaceId = req.params.spaceId;
    if(req.apiHubToken) {
        let secret = await secrets.getApiHubAuthSecret();
        if(secret === req.apiHubToken) {
            delete req.apiHubToken;
            return next();
        }else {
            return utils.sendResponse(res, 403, "application/json", {
                success: false,
                message: "User is not authorized to access this space."
            })
        }
    }

    const spaceStatusObject= await Space.APIs.getSpaceStatusObject(spaceId);
    if(spaceStatusObject.users[userId]){
        return next();
    }else{
        const error = new Error('Authorization failed. User is not authorized to access this space.');
        error.statusCode = 403;
        utils.sendResponse(res, 403, "application/json", {
            success: false,
            message: "User is not authorized to access this space."
        })
        next(error);
    }
}
module.exports = authorization