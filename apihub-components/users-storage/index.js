const {
    storeSecret,
    storeUser,
    loadUser,
    loadUserByEmail,
    loadUsersSecretsExist} = require("../users-storage/controller");

function bodyReaderMiddleware(req, res, next) {
    const data = [];

    req.on('data', (chunk) => {
        data.push(chunk);
    });

    req.on('end', () => {
        req.body = Buffer.concat(data);
        next();
    });
}
function UserStorage(server) {
    server.get("/users/:userId", loadUser);
    server.get("/users/:spaceId/secrets", async (request, response)=>{
        await loadUsersSecretsExist(server, request, response);
    })
    server.use("/users/*", bodyReaderMiddleware);
    server.put("/users/email", loadUserByEmail);
    server.put("/users/:userId", storeUser);
    server.put("/users/:spaceId/:userId/secret", async (request, response)=>{
        await storeSecret(server, request, response);
    });
}

module.exports = UserStorage;