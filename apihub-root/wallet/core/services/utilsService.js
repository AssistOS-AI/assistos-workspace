const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");

export class UtilsService {
    constructor() {
        this.crypto = crypto;
        this.w3cDID = openDSU.loadAPI("w3cdid");
    }

    generateRandomHex(length) {
        const randomBytes = this.crypto.generateRandom(length);
        return Array.from(randomBytes)
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
    }
}
