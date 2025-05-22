export class AccountSettingsPage{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        this.userImage=`/users/profileImage/${assistOS.user.email}`
        this.username=assistOS.user.name;
        this.email=assistOS.user.email;
        this.creationDate=assistOS.user.createdDate||"Unknown";
    }
    async addAPIKey(){
        await assistOS.UI.showModal( "add-apikey-modal");
    }
}