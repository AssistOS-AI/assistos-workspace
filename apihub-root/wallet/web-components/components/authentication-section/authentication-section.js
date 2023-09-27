export class authenticationSection {
    constructor() {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
    }

    beforeRender() {

    }

    navigateToRegisterPage(){
        webSkel.setDomElementForPages(mainContent);
        webSkel.changeToDynamicPage(`authentication-page`, {subpage:"register-page"});
    }

    navigateToLoginPage(){
        webSkel.setDomElementForPages(mainContent);
        webSkel.changeToDynamicPage(`authentication-page`, {subpage:"login-page"});

    }

    logout(){
        const user = { userId: crypto.getRandomSecret(32), secretToken: "" };
        localStorage.setItem("currentUser", JSON.stringify(user));
        window.location = "";
    }
}