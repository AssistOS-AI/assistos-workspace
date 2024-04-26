export class ChangeLlmModal {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    beforeRender() {
        let stringHTML = "";
        for (let llm of assistOS.space.llms) {
            stringHTML += `
            <div class="form-item" data-id="${llm.id}">            
                <div class="checkbox-label">
                    <div class="checkbox-inner-circle"></div>
                </div>
                <div class="form-label">${llm.name}</div>
            </div>`;
        }
        this.llms = stringHTML;
    }

    afterRender() {
        let formItems = this.element.querySelectorAll(".form-item");
        formItems.forEach((item) => {
            item.addEventListener("click", this.selectCheckbox.bind(this, item));
        });
        let llm = assistOS.space.getLLM();
        if(llm){
            this.selectedLLMID = llm.id;
            this.toggleCheckbox(this.element.querySelector(`[data-id = "${this.selectedLLMID}"]`));
        }
    }

    toggleCheckbox(element) {
        element.classList.toggle("form-item-selected");
        let innerCircle = element.querySelector(".checkbox-inner-circle");
        innerCircle.classList.toggle("checkbox-inner-circle-selected");
        let label = element.querySelector(".checkbox-label");
        label.classList.toggle("checkbox-label-selected");
    }
    selectCheckbox(_target) {
        if(_target.getAttribute("id") === this.selectedLLMID){
            return;
        }
        if(this.selectedLLMID){
            let previousSelected = this.element.querySelector(`[data-id = "${this.selectedLLMID}"]`);
            this.toggleCheckbox(previousSelected);
        }
        this.toggleCheckbox(_target);
        this.selectedLLMID = _target.getAttribute("data-id");
    }

    async changeLLM(_target) {
        assistOS.space.setLlm(this.selectedLLMID);
        assistOS.UI.closeModal(_target);
    }
}