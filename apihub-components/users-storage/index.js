const {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser
} = require("./controller");

function UserStorage(server) {

    setTimeout(async () => {
        const securityConfig = require('../securityConfig.json');
        const jwtConfig = securityConfig.JWT;
        const apihub = require('apihub');
        const utilsModule=require('../../assistOS-sdk/Loader.js').loadModule('util');
        const crypto = utilsModule.loadAPIs('crypto');

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

    const bodyReader = require('../apihub-component-middlewares/bodyReader.js')
    const authentication = require('../apihub-component-middlewares/authentication.js')
    //const authorization = require('../apihub-component-middlewares/authorization.js')

    server.use("/users/*", bodyReader);

    server.get("/users/verify", async (request, response) => {
        await activateUser(request, response, server)
    });

    server.use("/users/*", authentication);

    server.get("/users", async (request, response) => {
        await loadUser(request, response);
    });

    server.post("/users", async (request, response) => {
        await registerUser(request, response)
    });

    server.post("/users/login", async (request, response) => {
        await loginUser(request, response)
    });

    server.post("/users/logout", async (request, response) => {
        await logoutUser(request, response)
    });

}

module.exports = UserStorage;