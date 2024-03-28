const crypto=require('opendsu').loadAPI('crypto');
async function createUserLoginJWT(userData){
    const jwtPayload={
        id:userData.id,
        email:userData.email,
    }
    /* TODO Decide if the createJWT function from opendsu is usable in this context */
    return userData.id

}
module.exports=createUserLoginJWT