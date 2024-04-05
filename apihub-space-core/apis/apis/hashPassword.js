const crypto = require('crypto');
async function hashPassword(password){
    /* TODO Use a more secure hashing algorithm */
    return  crypto.createHash('sha256').update(password).digest('hex');
}
module.exports=hashPassword