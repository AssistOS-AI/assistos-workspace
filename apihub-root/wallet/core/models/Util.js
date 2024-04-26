export class Util{
    constructor(){
        return Util.getInstance();
    }

    static getInstance() {
        if (!this.instance) {
            this.instance = new Util();
        }
        return this.instance;
    }

    static getDemoUserCredentials() {
        try {
            const demoUserCredentials = JSON.parse(this.getCookieValue("demoCredentials"));
            return [demoUserCredentials.email, demoUserCredentials.password]
        } catch (error) {
            console.log(error + "No demo credentials found")
            return ["", ""];
        }
    }

    static getCookieValue(cookieName) {
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