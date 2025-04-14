const {
    registerClient,
    subscribeToObject,
    unsubscribeFromObject,
    closeClientConnection
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')

function Subscribers(server) {
    server.use("/events/*", bodyReader);

    server.get("/events", registerClient);
    server.get("/events/close", closeClientConnection);
    server.get("/events/subscribe/:objectId", subscribeToObject);
    server.get("/events/unsubscribe/:objectId", unsubscribeFromObject);
}

module.exports = Subscribers;
