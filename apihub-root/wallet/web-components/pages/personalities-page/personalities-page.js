export class PersonalitiesPage {
    constructor(element,invalidate) {
        this.modal = "showAddPersonalityModal";
        this.element = element;
        this.notificationId = webSkel.currentUser.space.getNotificationId();
        webSkel.currentUser.space.observeChange(this.notificationId,invalidate);
        this.invalidate=invalidate;
        this.invalidate();
    }
    beforeRender() {
        this.personalityBlocks = "";
        if (webSkel.currentUser.space.personalities.length > 0) {
            webSkel.currentUser.space.personalities.forEach((item) => {
                this.personalityBlocks += `<personality-unit data-name="${item.name}" data-description="${item.description}" data-id="${item.id}" data-image="${item.image}"></personality-unit>`;
            });
        }
    }
    expandTable(){
        let table = this.element.querySelector(".table");
        table.style.gridTemplateColumns = "repeat(4, 1fr)";
        table.style.gridColumnGap = "25px";
    }
    minimizeTable(){
        let table = this.element.querySelector(".table");
        table.style.gridTemplateColumns = "repeat(3, 1fr)";
        table.style.gridColumnGap = "0px";
    }
    afterRender(){
        if(this.boundExpandTable){
            this.element.removeEventListener("hideSidebar", this.boundExpandTable);
        }
        this.boundExpandTable = this.expandTable.bind(this);
        this.element.addEventListener("hideSidebar", this.boundExpandTable);
        if(this.boundMinimizeTable){
            this.element.removeEventListener("showSidebar", this.boundMinimizeTable);
        }
        this.boundMinimizeTable = this.minimizeTable.bind(this);
        this.element.addEventListener("showSidebar", this.boundMinimizeTable);
    }
    async showAddPersonalityModal() {
        await webSkel.showModal("add-personality-modal", { presenter: "add-personality-modal"});
    }

    async selectPersonality(_target){
        let personalityId = webSkel.reverseQuerySelector(_target, "personality-unit").getAttribute("data-id");
        await webSkel.changeToDynamicPage("edit-personality-page", `${webSkel.currentUser.space.id}/SpaceConfiguration/personality/${personalityId}/edit-personality-page`);
    }
}