const Space=require('../globalServerlessAPI/space.js');
const utils = require('../apihub-component-utils/utils.js');

async function authorization(req, res, next){
    const userId = req.userId;
    const spaceId = req.params.spaceId;
    if(req.skipAuthorisation) {
        delete req.skipAuthorisation;
        return next();
    }

    const spaceStatusObject= await Space.APIs.getSpaceStatusObject(spaceId);
    if(spaceStatusObject.users[userId]){
        return next();
    }else{
        const error = new Error('Authorization failed. User is not authorized to access this space.');
        error.statusCode = 403;
        utils.sendResponse(res, 403, "application/json", {
            message: "User is not authorized to access this space."
        })
        next(error);
    }
}
module.exports = authorization;