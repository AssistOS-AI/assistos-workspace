
const crypto=require('opendsu').loadAPI('crypto');

function hashPassword(password){
    /* TODO Use a more secure hashing algorithm */
    return Array.from(crypto.sha256JOSE(password))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

module.exports=hashPassword