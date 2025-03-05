const {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser,
    getUserAvatar,
    updateUserImage
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')
function UserStorage(server) {
    server.use("/users/*", bodyReader);
    server.get("/users/verify", activateUser);
    server.post("/users", registerUser);
    server.post("/users/login", loginUser);

    server.get("/users/profileImage/:userId", getUserAvatar);
    server.post("/users/profileImage/:userId", updateUserImage);

    server.use("/users/*", authentication);
    server.get("/users", loadUser);
    server.get("/users/logout", logoutUser);

}

module.exports = UserStorage;