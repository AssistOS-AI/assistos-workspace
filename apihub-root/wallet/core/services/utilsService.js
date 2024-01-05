const openDSU = require("opendsu");
const crypto = openDSU.loadApi("crypto");

export class UtilsService {
    constructor() {
        this.crypto = crypto;
        this.w3cDID = openDSU.loadAPI("w3cdid");
    }

    /* To be replaced with one from opendsu Crypto : Import issue*/
    generateId() {
        const length = 12;
        const randomBytes = new Uint8Array(length);
        window.crypto.getRandomValues(randomBytes);
        let randomStringId = "";
        while (randomStringId.length < length) {
            randomStringId = this.crypto.encodeBase58(randomBytes).slice(0, length);
        }
        return randomStringId;
    }
     parseURL(){
        let url = window.location.hash.split('/');
        debugger;
        switch(url[2]) {
            case "personality": {
                return url[3];
            }
            case "applications":{
                return url[3]
            }
            default:{
                console.error("no parameters for this url");
            }
        }
    }
    SaveElementTimer(fn, t) {
        return new function (){
            let timerObj = setInterval(fn, t);
            this.stop = async function(executeFn) {
                if (timerObj) {
                    if(executeFn){
                        await fn();
                    }
                    clearInterval(timerObj);
                    timerObj = null;
                }
                return this;
            }
            // start timer using current settings (if it's not already running)
            this.start = async function() {
                if (!timerObj) {
                    await this.stop();
                    timerObj = setInterval(fn, t);
                }
                return this;
            }
            // start with new or original interval, stop current interval
            this.reset = async function(newT = t) {
                t = newT;
                let self = await this.stop();
                return self.start();
            }
        };
    }

}
