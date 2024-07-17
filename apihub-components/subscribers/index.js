const {
    subscribeToObject,
    unsubscribeFromObject,
    registerClient,
    removeClient
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function Subscribers(server) {

    server.use("/events/*", bodyReader);
    server.use("/events/*", authentication);
    server.get("/events/updates", registerClient);
    server.get("/events/close", removeClient);
    server.get("/events/subscribe/:objectId", subscribeToObject);
    server.get("/events/unsubscribe/:objectId", unsubscribeFromObject);
}

module.exports = Subscribers;