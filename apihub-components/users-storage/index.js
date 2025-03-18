const {
    loginUser,
    loadUser,
    getUserImage,
    updateUserImage,
    logoutUser,
    getCurrentSpaceId
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const contextMiddleware = require('../apihub-component-middlewares/context.js')
function UserStorage(server) {
    server.use("/users/*", contextMiddleware);
    server.use("/users/*", bodyReader);
    server.post("/users/login", loginUser);

    server.get("/users/profileImage/:email", getUserImage);
    server.post("/users/profileImage/:email", updateUserImage);

    server.get("/users", loadUser);
    server.get("/users/logout", logoutUser);
    server.get("/users/spaceId/:email", getCurrentSpaceId);
}

module.exports = UserStorage;