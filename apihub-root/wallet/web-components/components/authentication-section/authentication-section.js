export class authenticationSection {
    constructor(element,invalidate) {
        this.element=element;
        this.invalidate=invalidate;
        this.invalidate();
    }

    beforeRender() {}

    async logout(){
        const crypto = require("opendsu").loadAPI("crypto");
        const user = { userId: crypto.getRandomSecret(32), secretToken: "", spaces: [{name: "Personal Space"}], currentSpaceId: "1"};
        webSkel.getService("AuthenticationService").setCachedCurrentUser(user);
        webSkel.setDomElementForPages(mainContent);
        await webSkel.changeToDynamicPage("authentication-page", "authentication-page");
    }

    afterRender(){
        this.element.querySelector("#logout-button").style.display = "none";
        if(currentUser.isPremium){
            this.element.querySelector("#logout-button").style.display = "block";
        }
    }
}