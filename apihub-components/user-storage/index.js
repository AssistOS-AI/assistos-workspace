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
    const { storeUser, loadUser, loadUserByEmail } = require("./controller");
    server.get("/users/:userId", loadUser);
    server.use("/users/*", bodyReaderMiddleware);
    server.put("/users/email", loadUserByEmail);
    server.put("/users/:userId", storeUser);
}

module.exports = UserStorage;