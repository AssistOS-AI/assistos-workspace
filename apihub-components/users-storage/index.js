const {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser
} = require("./controller");

function UserStorage(server) {

    const {bodyReader, authentication, authorization} = require('../apihub-component-middlewares/exporter.js')
    ('bodyReader', 'authentication', 'authorization');
    /* TODO */
    setTimeout(async()=>{
        const apihub=require('apihub');
        const secretService=await apihub.getSecretsServiceInstanceAsync();
        await secretService.putSecretAsync('test','test', 'test',true);
        },0)

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