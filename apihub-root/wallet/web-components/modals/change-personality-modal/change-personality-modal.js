export class ChangePersonalityModal {
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
        for (let personality of assistOS.space.personalities) {
            stringHTML += `
            <div class="form-item" data-id="${personality.id}">            
                <div class="checkbox-label">
                    <div class="checkbox-inner-circle"></div>
                </div>
                <div class="form-label">${personality.name}</div>
            </div>`;
        }
        this.personalities = stringHTML;
    }

    afterRender() {
        let formItems = this.element.querySelectorAll(".form-item");
        formItems.forEach((item) => {
            item.addEventListener("click", this.selectCheckbox.bind(this, item));
        });
        let agent = assistOS.space.getAgent();

        this.selectedPersonalityId = agent.id;
        this.toggleCheckbox(this.element.querySelector(`[data-id = "${this.selectedPersonalityId}"]`));

    }

    toggleCheckbox(element) {
        element.classList.toggle("form-item-selected");
        let innerCircle = element.querySelector(".checkbox-inner-circle");
        innerCircle.classList.toggle("checkbox-inner-circle-selected");
        let label = element.querySelector(".checkbox-label");
        label.classList.toggle("checkbox-label-selected");
    }
    selectCheckbox(_target) {
        if(_target.getAttribute("id") === this.selectedPersonalityId){
            return;
        }
        if(this.selectedPersonalityId){
            let previousSelected = this.element.querySelector(`[data-id = "${this.selectedPersonalityId}"]`);
            this.toggleCheckbox(previousSelected);
        }
        this.toggleCheckbox(_target);
        this.selectedPersonalityId = _target.getAttribute("data-id");
    }

    async changePersonality(_target) {
        await assistOS.space.setAgent(this.selectedPersonalityId);
        assistOS.UI.closeModal(_target);
        assistOS.space.notifyObservers(assistOS.space.getNotificationId());
    }
}