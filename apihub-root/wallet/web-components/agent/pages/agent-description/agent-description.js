const spaceModule = assistOS.loadModule("space");
const constants = require("assistos").constants;

export class AgentDescription {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.agentPagePresenter = this.element.closest("edit-agent-page").webSkelPresenter;
        this.agent = this.agentPagePresenter.agent;
        this.invalidate();
    }

    async beforeRender(){
        if (this.agent.imageId) {
            try {
                this.photo = await spaceModule.getImageURL(this.agent.imageId);
            } catch (e) {
                this.photo = "./wallet/assets/images/default-agent.png";
            }
        } else {
            this.photo = "./wallet/assets/images/default-agent.png";
        }
        if (this.agent.name === constants.DEFAULT_AGENT_NAME) {
            this.disabled = "disabled";
        }
        this.agentName = this.agent.name;
    }
    afterRender(){
        let description = this.element.querySelector("textarea");
        description.innerHTML = this.agent.description;
        let nameInput = this.element.querySelector("#name");
        nameInput.addEventListener("input", (e) => {
            this.agent.name = assistOS.UI.sanitize(e.target.value);
            this.agentPagePresenter.checkSaveButtonState();
        });
        let descriptionInput = this.element.querySelector("#description");
        descriptionInput.addEventListener("input", (e) => {
            this.agent.description = assistOS.UI.sanitize(e.target.value);
            this.agentPagePresenter.checkSaveButtonState();
        });
    }
    preventRefreshOnEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            this.element.querySelector(".magnifier-container").click();
        }
    }
}