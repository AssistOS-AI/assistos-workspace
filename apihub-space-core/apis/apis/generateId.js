const crypto = require("opendsu").loadAPI("crypto");

const {DEFAULT_ID_LENGTH}=require('../../constants/exporter.js')('utils-constants');
function generateId(length=DEFAULT_ID_LENGTH) {
    let random = crypto.getRandomSecret(length);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = crypto.encodeBase58(random).slice(0, length);
    }
    return randomStringId;
}

module.exports=generateId