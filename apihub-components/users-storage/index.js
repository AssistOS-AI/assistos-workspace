const {
    loginUser,
    loadUser,
    getUserImage,
    updateUserImage
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')
function UserStorage(server) {
    server.use("/users/*", bodyReader);
    server.get("/users/verify", activateUser);
    server.post("/users", registerUser);
    server.post("/users/login", loginUser);

    server.get("/users/profileImage/:email", getUserImage);
    server.post("/users/profileImage/:email", updateUserImage);

    server.use("/users/*", authentication);
    server.get("/users", loadUser);
}

module.exports = UserStorage;