const spaceModule = assistOS.loadModule("space");
const documentModule = assistOS.loadModule("document");
export class RunScript {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = documentPresenter._document;
        this.docID = this._document.docId;
        this.invalidate();
    }
    async beforeRender() {

    }
    afterRender() {
        let docIdInput = this.element.querySelector("#docID");
        let saveDocIdButton = this.element.querySelector(".save-doc-id");
        docIdInput.addEventListener("input", (e) => {
            const regex = /^[a-zA-Z0-9_]+$/;
            let newDocId = e.target.value;
            if(newDocId !== this._document.docId){
                saveDocIdButton.classList.remove("hidden");
            } else {
                saveDocIdButton.classList.add("hidden");
            }
            if (regex.test(newDocId)) {
                saveDocIdButton.classList.remove("disabled");
            } else {
                saveDocIdButton.classList.add("disabled");
            }
        });
    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    addArg(){
        let argList = this.element.querySelector(".args-list");
        let argsNr = argList.children.length;
        let lastArg = argList.querySelector(".last-arg-item");
        if(lastArg){
            lastArg.classList.remove("last-arg-item");
        }
        let noArguments = argList.querySelector(".no-arguments");
        if(noArguments){
            noArguments.remove();
        }
        let newArg = document.createElement("div");
        newArg.classList.add("arg-item");
        newArg.classList.add("last-arg-item");
        newArg.classList.add("maintain-focus");
        newArg.innerHTML = `
            <span class="arg-label">arg${argsNr + 1}</span>
            <input type="text" class="arg-input form-input">
            <div class="delete-arg">
                <img data-local-action="deleteArg" src="./wallet/assets/icons/trash-can.svg" alt="delete">
            </div>`;
        argList.appendChild(newArg);
    }
    recalculateArgsNr(){
        let argList = this.element.querySelector(".args-list");
        let args = argList.children;
        if(args.length === 0){
            argList.innerHTML = `<div class="no-arguments">No arguments</div>`
        }
        for(let i = 0; i < args.length; i++){
            let argLabel = args[i].querySelector(".arg-label");
            if(argLabel){
                argLabel.innerText = `arg${i + 1}`;
            }
        }
    }
    deleteArg(targetElement){
        let argItem = targetElement.closest(".arg-item");
        if(argItem.classList.contains("last-arg-item")){
            let secondLastArg = argItem.previousElementSibling;
            if(secondLastArg){
                secondLastArg.classList.add("last-arg-item");
            }
        }
        if(argItem){
            argItem.remove();
        }
        this.recalculateArgsNr();
    }
    async saveDocId(button) {
        let input = this.element.querySelector("#docID");
        this._document.docId = input.value;
        await documentModule.updateDocument(assistOS.space.id, this._document.id,
            this._document.title,
            this._document.docId,
            this._document.category,
            this._document.infoText,
            this._document.commands,
            this._document.comments);
        button.classList.add("hidden");
    }
    async runScript(button) {
        button.classList.add("disabled");
        let args = [];
        let argList = this.element.querySelector(".args-list");
        let argsElem = argList.children;
        for(let i = 0; i < argsElem.length; i++){
            let input = argsElem[i].querySelector(".arg-input");
            args.push(input.value);
        }
        try {
            await spaceModule.runCode(assistOS.space.id, assistOS.UI.unsanitize(this._document.infoText), args);
        } catch (e) {
            button.classList.remove("disabled");
            assistOS.UI.closeModal(this.element);
            return assistOS.showToast(`Commands failed: ${e.message}`, "error", 5000);
        }
        button.classList.remove("disabled");
        assistOS.UI.closeModal(this.element);
        assistOS.showToast("Commands executed", "success");
    }
}