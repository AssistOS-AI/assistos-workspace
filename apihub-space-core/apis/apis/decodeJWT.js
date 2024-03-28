async function decodeJWT(JWT) {
    try {
        return JWT
    } catch (error) {
        throw new Error("Invalid JWT");
    }
}
module.exports=decodeJWT;