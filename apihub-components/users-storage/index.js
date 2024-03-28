const {
    registerUser,
    activateUser,
    loginUser,
    loadUser,
    logoutUser
} = require("./controller");

function UserStorage(server) {
    const bodyReaderMiddleware = require('../requests-processing-apis/exporter.js')
    ('bodyReaderMiddleware');


    server.use("/users/*", bodyReaderMiddleware);

    server.get("/users", async (request, response) => {
        await loadUser(request,response);
    });
    server.post("/users", async (request, response) => {
        await registerUser(request, response)
    });

    server.post("/users/verify", async (request, response) => {
        await activateUser(request, response, server)
    });

    server.post("/users/login", async (request, response) => {
        await loginUser(request, response)
    });
    server.post("/users/logout", async (request, response) => {
        await logoutUser(request, response)
    });

    /*  server.put("/users/:userId", async (request, response) => {
          await updateUser(request, response)
      });*/

    /* server.put("/users/email", loadUserByEmail);
    server.put("/users/:spaceId/secret", async (request, response)=>{
        await storeSecret(server, request, response);
    });
    server.get("/users/:spaceId/secrets", async (request, response)=>{
        await loadUsersSecretsExist(server, request, response);
    })
    */
}

module.exports = UserStorage;