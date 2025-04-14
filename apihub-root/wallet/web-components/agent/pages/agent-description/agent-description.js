const llmModule = require("assistos").loadModule("llm", {});
const spaceModule = require("assistos").loadModule("space", {});
const agentModule = require("assistos").loadModule("agent", {});
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
        let image = this.element.querySelector(".agent-photo");
        image.addEventListener("error", (e) => {
            e.target.src = "./wallet/assets/images/default-agent.png";
        });

        let description = this.element.querySelector("textarea");
        description.innerHTML = this.agent.description;

        let photoInput = this.element.querySelector("#photo");
        this.boundShowPhoto = this.showPhoto.bind(this, photoInput)
        photoInput.addEventListener("input", this.boundShowPhoto);
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
    verifyPhotoSize(element)  {
        if (element.files.length > 0) {
            return element.files[0].size <= 1048576 * 5; // 5MB
        }
        return true;
    };
    async showPhoto(photoInput, event) {
        if (!this.verifyPhotoSize(photoInput)) {
            assistOS.showToast("The file size should not exceed 5MB", "error", 5000);
            return;
        }
        let photoContainer = this.element.querySelector(".agent-photo");
        this.agentPagePresenter.photoAsFile = photoInput.files[0];
        photoContainer.src = await assistOS.UI.imageUpload(photoInput.files[0]);
        this.agentPagePresenter.checkSaveButtonState();
    }

    triggerInputFileOpen(_target, id) {
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`#${id}`);
        input.click();
        _target.setAttribute("data-local-action", `triggerInputFileOpen ${id}`);
    }
}