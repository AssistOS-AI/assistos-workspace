import AppManager from "./app-manager.js";
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
    let presenter;

    customElements.define(
        componentName,
        class extends HTMLElement {
            constructor() {
                super();
                this.variables = {};
                let vars = this.findDoubleDollarWords(template);
                vars.forEach((vn) => {
                    vn = vn.slice(2);
                    this.variables[vn] = "";
                });
                this.templateArray = this.createTemplateArray(template);
            }

            findDoubleDollarWords(str) {
                let regex = /\$\$\w+/g;
                return str.match(regex) || []; // Returnează un array de cuvinte sau un array gol dacă nu se găsesc cuvinte
            }

            createTemplateArray(str) {
                let currentPos = 0;
                const STR_TOKEN = 0;
                const VAR_TOKEN = 1;
                function isSeparator(ch) {
                    const regex = /^[a-zA-Z0-9_\-$]$/;
                    return !regex.test(ch);
                }

                function startVariable(cp) {
                    if(str[cp] !== '$' || str[cp+1] !== '$') {
                        return STR_TOKEN;
                    }
                    else {
                        return VAR_TOKEN;
                    }
                }
                let result = [];
                let k = 0;
                while(k < str.length ) {
                    while(!startVariable(k) && k < str.length) {
                        k++;
                    }
                    result.push(str.slice(currentPos, k-1));
                    currentPos = k;

                    while(!isSeparator(str[k]) && k < str.length) {
                        k++;
                    }
                    result.push(str.slice(currentPos, k));
                    currentPos = k;
                }
                return result;
            }

            async connectedCallback() {
                let content= template;

                Array.from(this.attributes).forEach(attr => {
                    console.log(`${attr.nodeName} = ${attr.nodeValue}`);
                    if(typeof this.variables[attr.nodeName]) {
                        this.variables[attr.nodeName] = attr.nodeValue;
                        // console.log(`This.variables: ${this.variables[attr.nodeName]}`);
                    }
                    if(attr.name === "data-presenter") {
                        this.presenter = window.appManager.initialisePresenter(attr.nodeValue);
                        this.presenter.invalidate = () => {
                            this.presenter.beforeRender();
                            for(let vn in this.variables) {
                                if(typeof this.presenter[vn] !== "undefined") {
                                    this.variables[vn] = this.presenter[vn];
                                }
                            }
                            this.refresh();
                        }
                    }
                });
                if(!this.presenter) {
                    this.refresh();
                }
            }

            refresh() {
                let contentArray = this.templateArray.map((item) => {
                    if(item.startsWith("$$")) {
                        return this.variables[item];
                    }
                    return item;
                });

                this.innerHTML = contentArray.join("");
            }
        }
    );
};

defineComponent("llm-item-renderer","../components/llm-item-renderer/llm-item-renderer.html");

const appManager = new AppManager();
window.appManager = appManager;

// Actions that can be used from apihub-components controllers can be defined here

appManager.registerAction("showAddLLMModal", async (...params) => {
    await showModal(appManager.element, "add-llm-modal", {});
})

appManager.registerAction("closeModal", async (modal,_param) => {
    closeModal(modal);
});

appManager.registerAction("changePage", (_target, toolId) => {
    appManager.currentToolId = toolId;
    appManager.navigateToToolPage();
})

appManager.registerAction("showActionBox", async (_target, primaryKey) => {
    appManager.showActionBox(primaryKey);
})

await appManager.init();

import { llmsPresenter } from "./presenters/llms-presenter.js";

window.appManager.registerPresenter("llmsPresenter", llmsPresenter);

// Modal components defined here
defineComponent("add-llm-modal", "/components/add-llm-modal/add-llm-modal.html");
// defineComponent("llm-item-renderer", "/components/llm-item-renderer/llm-item-renderer.html");
defineComponent("llms-page", "/pages/llms-page/llms-page.html");
defineComponent("page-template", "/pages/page-template/page-template.html");
