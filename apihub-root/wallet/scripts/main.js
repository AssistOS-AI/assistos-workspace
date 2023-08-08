import AppManager from "./app-manager.js";
import { extractFormInformation, checkValidityFormInfo } from "./utils/form-utils.js";
import { closeModal, showModal } from "./utils/modal-utils.js";
import { getAppUrl } from "./utils/url-utils.js";

function sanitize(string) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };
    const reg = /[&<>"'/]/ig;
    return string.replace(reg, (match)=>(map[match]));
}
const defineComponent = async (componentName, templatePath) => {
    let template = await (await fetch(getAppUrl(templatePath))).text();
    customElements.define(
        componentName,
        class extends HTMLElement {
            constructor() {
                super();
            }

            async connectedCallback() {
                let content=template;
                Array.from(this.attributes).forEach(attr => {
                    let textSanitized=sanitize(attr.nodeValue);
                    content=content.replaceAll(`$$${attr.nodeName}`,textSanitized);
                })
                this.innerHTML = content;
            }
        }
    );
};

const appManager = new AppManager();
window.appManager = appManager;

// Actions that can be used from apihub-components controllers can be defined here

appManager.registerAction("showAddLLMModal", async (...params) => {
    await showModal(appManager.element, "add-llm-modal", {});
})

appManager.registerAction("closeModal", async (modal,_param) => {
    closeModal(modal);
});

appManager.registerAction("changeTool", async (_target,toolId) => {
    appManager.currentToolId = toolId;
    appManager.navigateToToolPage();
})

appManager.registerAction("showActionBox", async (_target, primaryKey) => {
    appManager.showActionBox(primaryKey);
})

appManager.init();

// Modal components defined here
defineComponent("add-llm-modal", "/components/add-llm-modal/add-llm-modal.html");
defineComponent("llm-item-renderer", "/components/llm-item-renderer/llm-item-renderer.html");
