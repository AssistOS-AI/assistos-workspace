export class AddMarketplaceModal {
    constructor(element,invalidate){
       this.invalidate=invalidate;
         this.invalidate();
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    beforeRender() {}

    async addMarketplace(_target){
        let formData = await assistOS.UI.extractFormInformation(_target);
        if(formData.isValid) {
            assistOS.UI.closeModal(_target);
            alert("Feature is currently being built!")
            //location.reload();
        }
    }
}