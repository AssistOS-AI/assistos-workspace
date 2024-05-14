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
}
