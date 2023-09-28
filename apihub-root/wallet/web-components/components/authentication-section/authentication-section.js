export class authenticationSection {
    constructor(element) {
        setTimeout(()=> {
            this.invalidate();
        }, 0);
        this.updateState = ()=> {
            this.invalidate();
        }
        this.element=element;
    }

    beforeRender() {

    }

    async navigateToRegisterPage(){
        webSkel.setDomElementForPages(mainContent);
        await webSkel.changeToDynamicPage(`authentication-page`, {subpage:"register-page"});
    }

    async navigateToLoginPage(){
        webSkel.setDomElementForPages(mainContent);
        await webSkel.changeToDynamicPage(`authentication-page`, {subpage:"login-page"});

    }

    logout(){

        const user = { userId: crypto.getRandomSecret(32), secretToken: "" };
        webSkel.getService("AuthenticationService").setCachedCurrentUser(user);
        window.location = "";
    }

    afterRender(){
        this.element.querySelector("#logout-button").style.display = "none";
        this.element.querySelector("#login-button").style.display = "block";
        this.element.querySelector("#register-button").style.display = "block";
        if(currentUser.isPremium){
            this.element.querySelector("#logout-button").style.display = "block";
            this.element.querySelector("#login-button").style.display = "none";
            this.element.querySelector("#register-button").style.display = "none";
        }
    }
}