const {
    getLatestUpdates,
    subscribeToObject,
    unsubscribeFromObject,
    registerClient,
    removeClient
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function Subscribers(server) {
    server.use("/updates/*", bodyReader);
    server.use("/updates/*", authentication);
    //server.get("/updates/:spaceId", getLatestUpdates);
    server.get("/updates/subscribe/:spaceId/:objectId", subscribeToObject);
    server.get("/updates/unsubscribe/:spaceId/:objectId", unsubscribeFromObject);

    server.use("/events/*", authentication);
    server.use("/events/*", bodyReader);
    server.get("/events/updates", registerClient);
    server.get("/events/close", removeClient);
    server.get("/events/subscribe/:objectId", subscribeToObject);
    server.get("/events/unsubscribe/:objectId", unsubscribeFromObject);
}

module.exports = Subscribers;