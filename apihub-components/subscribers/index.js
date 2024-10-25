const {
    registerClient,
    subscribeToObject,
    unsubscribeFromObject
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function Subscribers(server) {
    server.use("/events/*", bodyReader);
    server.use("/events/*", authentication);

    server.get("/events", registerClient);

    server.post("/events/subscribe", subscribeToObject);
    server.post("/events/unsubscribe", unsubscribeFromObject);
}

module.exports = Subscribers;
