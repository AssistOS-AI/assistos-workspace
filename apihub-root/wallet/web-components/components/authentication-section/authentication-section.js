export class authenticationSection {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    async navigateToRegisterPage(){
        webSkel.setDomElementForPages(mainContent);
        await webSkel.changeToDynamicPage(`authentication-page`, null, {subpage:"register-page"});
    }

    async navigateToLoginPage(){
        webSkel.setDomElementForPages(mainContent);
        await webSkel.changeToDynamicPage(`authentication-page`, null, {subpage:"login-page"});

    }

    logout(){
        const crypto = require("opendsu").loadAPI("crypto");
        const user = { userId: crypto.getRandomSecret(32), secretToken: "", spaces: [{name: "Personal Space"}], currentSpaceId: "1"};
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