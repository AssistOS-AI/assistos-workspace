export class UtilsService {
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
    getDemoUserCredentials() {
        try {
            const demoUserCredentials = JSON.parse(this.getCookieValue("demoCredentials"));
            return [demoUserCredentials.email, demoUserCredentials.password]
        } catch (error) {
            console.log(error + "No demo credentials found")
            return ["", ""];
        }
    }
    getCookieValue(cookieName) {
        const name = cookieName + "=";
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    }
    base64ToBlob(base64, contentType = '', sliceSize = 512) {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);
            const byteNumbers = new Array(slice.length);

            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    }
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]); // Get the Base64 string without the data URL prefix
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
