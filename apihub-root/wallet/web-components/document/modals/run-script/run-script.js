const spaceModule = assistOS.loadModule("space");
export class RunScript {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.element.classList.add("maintain-focus");
        let documentPresenter = document.querySelector("document-view-page").webSkelPresenter;
        this._document = documentPresenter._document;
        this.invalidate();
    }
    async beforeRender() {

    }
    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
    addArg(){
        let argList = this.element.querySelector(".args-list");
        let argsNr = argList.children.length;
        let newArg = document.createElement("div");
        newArg.classList.add("arg-item");
        newArg.innerHTML = `
            <div class="delete-arg" data-local-action="deleteArg">-</div>
            <span class="arg-label">arg${argsNr + 1}</span>
            <input type="text" class="arg-input">`;
        argList.appendChild(newArg);
    }
    recalculateArgsNr(){
        let argList = this.element.querySelector(".args-list");
        let args = argList.children;
        for(let i = 0; i < args.length; i++){
            let argLabel = args[i].querySelector(".arg-label");
            if(argLabel){
                argLabel.innerText = `arg${i + 1}`;
            }
        }
    }
    deleteArg(targetElement){
        let argItem = targetElement.closest(".arg-item");
        if(argItem){
            argItem.remove();
        }
        this.recalculateArgsNr();
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