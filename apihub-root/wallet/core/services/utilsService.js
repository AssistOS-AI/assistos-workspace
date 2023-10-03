const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");

export class UtilsService {
    constructor() {
        this.crypto = crypto;
        this.w3cDID = openDSU.loadAPI("w3cdid");
    }
    /* To be replaced with one from opendsu Crypto : Import issue*/
    generateId(){
        const length = 12;
        const randomBytes = new Uint8Array(length);
        window.crypto.getRandomValues(randomBytes);
        let randomStringId="";
        while(randomStringId.length<length) {
            randomStringId=this.crypto.encodeBase58(randomBytes).slice(0,length);
        }
        return randomStringId;
        }
}
