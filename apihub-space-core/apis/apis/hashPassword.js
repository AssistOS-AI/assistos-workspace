
const crypto=require('opendsu').loadAPI('crypto');

async function hashPassword(password){
    /* TODO Use a more secure hashing algorithm */
    return await crypto.sha256(password);
}
module.exports=hashPassword