export class abstractProofreadPage {
    constructor(element, invalidate) {
        this.element=element;
        this._document = webSkel.space.getDocument(webSkel.space.currentDocumentId);
        this.invalidate = invalidate;
        this.invalidate();

    }

    beforeRender() {
        this.abstractText = this._document.abstract;
        document.removeEventListener("click", this.exitEditMode, true);
    }
    afterRender(){
        if(this.improvedAbstract){
            let improvedAbstractSection = this.element.querySelector(".improved-abstract-container");
            improvedAbstractSection.style.display = "block";
        }
    }

    async openViewPage() {
        await webSkel.changeToDynamicPage("document-view-page", `documents/${this._document.id}/document-view-page`);
    }

    async suggestImprovements(_target){
        let scriptId = webSkel.space.getScriptIdByName("proofread");
        let result = await webSkel.getService("LlmsService").callScript(scriptId, this.abstractText);
        this.improvedAbstract = result.responseString || result.responseJson;
        this.invalidate();
    }

    async enterEditMode(_target, field) {
        let abstract = this.element.querySelector(`.${field}`);
        if(!abstract.hasAttribute("contenteditable")){
            document.addEventListener("click", this.exitEditMode.bind(this, abstract), true);
        }
        abstract.setAttribute("contenteditable", "true");
        abstract.focus();
    }

    async exitEditMode (abstract, event) {
        if (abstract.getAttribute("contenteditable") && !abstract.contains(event.target)) {
            abstract.setAttribute("contenteditable", "false");
            if(abstract.classList.contains("abstract-content")){
                await this._document.updateAbstract(abstract.innerText);
            }
            else {
                this.improvedAbstract = abstract.innerText;
            }
        }
    }


    async acceptImprovements(_target) {
        let abstract = this.element.querySelector(".improved-abstract").innerText;
        if(abstract !== this._document.abstract) {
            await this._document.updateAbstract(abstract);
            this.invalidate();
        }
    }
    async openEditAbstractPage() {
        await webSkel.changeToDynamicPage("edit-abstract-page", `documents/${this._document.id}/edit-abstract-page`);
    }
    async proofreadAbstract(){
        await webSkel.changeToDynamicPage("abstract-proofread-page", `documents/${this._document.id}/abstract-proofread-page`);
    }

}

