const {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser,
    userSecretExists,
    getUserAvatar,
    addAPIKey,
    deleteAPIKey
} = require("./controller");

const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
const authentication = require('../apihub-component-middlewares/authentication.js')

function UserStorage(server) {

    setTimeout(async () => {
        const securityConfig = require('../securityConfig.json');
        const jwtConfig = securityConfig.JWT;
        const apihub = require('apihub');
        const crypto = require("../apihub-component-utils/crypto.js");

        const accessToken = {
            ...jwtConfig.AccessToken,
            secret: crypto.generateSecret()

        }
        const refreshToken = {
            ...jwtConfig.RefreshToken,
            secret: crypto.generateSecret()
        }
        const emailToken = {
            ...jwtConfig.EmailToken,
            secret: crypto.generateSecret()
        }

        const secretService = await apihub.getSecretsServiceInstanceAsync(securityConfig.SERVER_ROOT_FOLDER);

        await secretService.putSecretAsync('JWT', 'AccessToken', accessToken);
        await secretService.putSecretAsync('JWT', 'RefreshToken', refreshToken);
        await secretService.putSecretAsync('JWT', 'EmailToken', emailToken);

    }, 0);

    setTimeout(async () => {
        const configs = require('../config.json');
        const createDefaultUser = configs.CREATE_DEMO_USER;
        if (createDefaultUser) {
            const User = require('./user.js');
            await User.APIs.createDemoUser();
        }
    }, 0);


    server.use("/users/*", bodyReader);


    server.post("/users/secrets/exists/:spaceId", userSecretExists);


    server.get("/users/verify", activateUser);

    server.post("/users", registerUser);

    server.post("/users/login", loginUser);

    server.get("/users/profileImage/:userId", getUserAvatar);


    server.use("/users/*", authentication);

    server.get("/users", loadUser);

    server.get("/users/profileImage", getUserAvatar);

    server.post("/users/logout", logoutUser);

    server.post("/users/secrets/keys",addAPIKey);
    server.post("/users/:userId/secrets/keys",addAPIKey);
    server.delete("/users/secrets/keys/:keyId",deleteAPIKey);
    server.delete("/users/:userId/secrets/keys/:keyId",deleteAPIKey);


}

module.exports = UserStorage;