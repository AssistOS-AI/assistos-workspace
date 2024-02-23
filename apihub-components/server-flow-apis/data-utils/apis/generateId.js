const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");

function generateId() {
    const length = 12;
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);
    let randomStringId = "";
    while (randomStringId.length < length) {
        randomStringId = this.crypto.encodeBase58(randomBytes).slice(0, length);
    }
    return randomStringId;
}
console.log(generateId());
module.exports=generateId