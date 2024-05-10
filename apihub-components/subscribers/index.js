const {getLatestUpdates, subscribeToObject, unsubscribeFromObject} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')
function Subscribers(server){
    server.use("/updates/*", bodyReader);
    server.use("/updates/*", authentication);
    server.get("/updates/:spaceId", getLatestUpdates);
    server.get("/updates/subscribe/:spaceId/:objectId", subscribeToObject);
    server.get("/updates/unsubscribe/:spaceId/:objectId", unsubscribeFromObject);
}
module.exports = Subscribers;