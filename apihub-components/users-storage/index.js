const {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser,
    getUsersSecretsExist,
    storeSecret,
    getUserProfileImage
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
    server.get("/users/secrets/:spaceId", getUsersSecretsExist);
    server.post("/users/secrets/:spaceId", storeSecret);

    server.get("/users/verify", async (request, response) => {
        await activateUser(request, response)
    });

    server.post("/users", async (request, response) => {
        await registerUser(request, response)
    });

    server.post("/users/login", async (request, response) => {
        await loginUser(request, response)
    });
    server.get("/users/profileImage/:userId",async(request,response)=>{
        await getUserProfileImage(request,response)
    });

    server.use("/users/*", authentication);

    server.get("/users", async (request, response) => {
        await loadUser(request, response);
    });

    server.post("/users/logout", async (request, response) => {
        await logoutUser(request, response)
    });

}

module.exports = UserStorage;