const spaceModule = require("assistos").loadModule("space", {});
const agentModule = require("assistos").loadModule("agent", {});
export class AddAgent {
    constructor(element,invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    beforeRender() {}

    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }

    triggerInputFileOpen(_target){
        _target.removeAttribute("data-local-action");
        let input = this.element.querySelector(`input[type="file"]`);
        input.click();
        _target.setAttribute("data-local-action", "triggerInputFileOpen");
    }

    async addAgentSubmitForm(_target) {
        const verifyPhotoSize = (element) => {
            return !element.files[0]? true : element.files[0].size <= 1048576;
        };
        const conditions = {"verifyPhotoSize": {fn:verifyPhotoSize, errorMessage:"Image too large! Image max size: 1MB"} };
        let formInfo = await assistOS.UI.extractFormInformation(_target, conditions);
        if(formInfo.isValid) {
            let reader = new FileReader();
            reader.onload = async (e) => {
                const uint8Array = new Uint8Array(e.target.result);
                let imageId = await spaceModule.putImage(uint8Array);
                let agentData = {
                    name: formInfo.data.name,
                    description: formInfo.data.description,
                    imageId: imageId,
                };
                try {
                    await agentModule.addAgent(assistOS.space.id, agentData);
                } catch (e) {
                    assistOS.showToast(e.message, "error", 3000);
                }

                document.querySelector('chat-container').webSkelPresenter.invalidate();

                assistOS.UI.closeModal(_target,{refresh:true});
            };
            if(!formInfo.data.photo){
                let image = document.createElement("img");
                image.src = "./wallet/assets/images/default-agent.png";
                image.addEventListener("load", () => {
                    let canvas = document.createElement("canvas");
                    canvas.width = image.width;
                    canvas.height = image.height;
                    let ctx = canvas.getContext("2d");
                    ctx.drawImage(image, 0, 0);
                    canvas.toBlob((blob) => {
                        formInfo.data.photo = new File([blob], "default-agent.png", {type: "image/png"});
                        reader.readAsArrayBuffer(formInfo.data.photo);
                    });
                }, {once: true});
            } else {
                reader.readAsArrayBuffer(formInfo.data.photo);
            }
        }
    }
}