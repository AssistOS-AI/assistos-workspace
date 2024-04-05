const createJWT = require('../exporter.js')
('createJWT');

async function createUserJWT(userData) {
    const payloadData = {
        id: userData.id,
        role: "user"
    }
/*    const accessToken = await createJWT(payloadData);
    const refreshToken = await createJWT(payloadData);*/
    //return [accessToken, refreshToken]
    return userData.id

}

module.exports = createUserJWT