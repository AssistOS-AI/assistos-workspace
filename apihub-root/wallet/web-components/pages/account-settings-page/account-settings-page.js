export class AccountSettingsPage{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    beforeRender(){
        this.userImage=`/users/profileImage/${assistOS.user.id}`
        this.username=assistOS.user.name;
        this.email=assistOS.user.email;
        this.creationDate=assistOS.user.createdDate||"Unknown";
    }
    async addKey(){
        await assistOS.UI.showModal( "add-apikey-modal");
    }
}