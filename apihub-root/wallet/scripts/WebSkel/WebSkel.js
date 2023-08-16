import {findDoubleDollarWords,createTemplateArray} from "./utils/template-utils.js";

class WebSkel {
    constructor() {
        this._appContent={};
        this.presentersRegistry = {};
        this._documentElement = document;
        this.actionRegistry = {};
        this.registerListeners();
        console.log("creating new app manager instance");
    }

    registerPresenter(name, instance) {
        this.presentersRegistry[name] = instance;
    }

    initialisePresenter(presenterName) {
        let presenter;
        try {
            presenter = new this.presentersRegistry[presenterName];
        } catch(e) {
            console.error(`No presenter ${presenterName} found.`);
        }
        return presenter;
    }

    async showLoading() {
        const loading = document.createElement("dialog");
        loading.classList.add("spinner");
        document.body.appendChild(loading);
        await loading.showModal();
        return loading;
    }

    async changeToDynamicPage(pageHtmlTagName, skipHistoryState) {
        let result = `<${pageHtmlTagName} data-presenter="${pageHtmlTagName}"></${pageHtmlTagName}>`;
        if (!skipHistoryState) {
            const path = "#" + pageHtmlTagName; // leave baseUrl for now
            window.history.pushState({ pageHtmlTagName, relativeUrlContent: result }, path.toString(), path);
        }
        this.updateAppContent(result);
    }

    async changeToStaticPage(pageUrl, skipHistoryState) {
        const loading= await this.showLoading();
        try {
            const pageContent = this.fetchTextResult(pageUrl, skipHistoryState);
             this.updateAppContent(pageContent);
        } catch (error) {
            console.log("Failed to change page", error);
        } finally {
            loading.close();
            loading.remove();
        }
    }

    async interceptAppContentLinks(e) {
        let target = e.target || e.srcElement;
        /*
            Examples:
            <a data-page="llm-page 1234"> LLM Page </a>
            <a data-path="/default/posts/1234"></a>
         */

        if (target.hasAttribute("data-page")) {
            let pageName = target.getAttribute("data-page");
            e.preventDefault();
            return await this.changeToDynamicPage(pageName);
        }
        if (target.hasAttribute("data-path")) {
            let pageName = target.getAttribute("data-path");
            e.preventDefault();
            return await this.changeToStaticPage(pageName);
        }
    }

    setDomElementForPages(elem) {
        this._appContent.innerHTML = elem;
    }

    updateAppContent(content) {
        console.log("HTML-Content Injected:",content);
        this._appContent.innerHTML = content;
    }

    registerListeners() {
        this._documentElement.addEventListener("click", this.interceptAppContentLinks.bind(this));
        window.onpopstate = (e) => {
            if (e.state && e.state.relativeUrlContent) {
                this.updateAppContent(e.state.relativeUrlContent);
            }
        };

        // register listener for data-action attribute
        this._documentElement.addEventListener("click", (event) => {
            let target= event.target;

            while (target && target !== this._documentElement) {
                if (target.hasAttribute("data-action")) {
                    event.preventDefault(); // Cancel the native event
                    event.stopPropagation(); // Don't bubble/capture the event any further

                    const action = target.getAttribute("data-action");
                    const [actionName, ...actionParams] = action.split(" ");

                    if (actionName) {
                        this.callAction(actionName,target,...actionParams);
                    }
                    else {
                        console.error(`${target} : data action attribute value should not be empty!`);
                    }
                    break;
                }
                target = target.parentElement;
            }
        });
    }

    registerAction(actionName, actionHandler) {
        this.actionRegistry[actionName] = actionHandler;
    }

    callAction(actionName, ...params) {
        const actionHandler = this.actionRegistry[actionName];
        if (!actionHandler) {
            throw new Error(`No action handler registered for "${actionName}"`);
        }

        let thisCall = params && params[0] instanceof HTMLElement ? params[0] : null;

        actionHandler.call(thisCall, ...params);
    }

    async fetchTextResult(relativeUrlPath, skipHistoryState) {
        const appBaseUrl = new URL(`${window.location.protocol}//${window.location.host}`);
        if(relativeUrlPath.startsWith("#")) {
            relativeUrlPath=relativeUrlPath.slice(1);
        }
        const response = await fetch(appBaseUrl + '/' + relativeUrlPath);
        if (!response.ok) {
            throw new Error("Failed to execute request");
        }

        const result = await response.text();

        if (!skipHistoryState) {
            // const path = new URL(relativeUrlPath, baseUrl);
            const path = appBaseUrl + "#" + relativeUrlPath; // leave baseUrl for now
            window.history.pushState({ relativeUrlPath, relativeUrlContent: result }, path.toString(), path);
        }
        return result;
    }

    defineComponent = async (componentName, templatePath) => {
        let template = await (await fetch(templatePath)).text();
        customElements.define(
            componentName,
            class extends HTMLElement {
                constructor() {
                    super();
                    this.variables = {};
                    let vars = findDoubleDollarWords(template);
                    vars.forEach((vn) => {
                        vn = vn.slice(2);
                        this.variables[vn] = "";
                    });
                    this.templateArray = createTemplateArray(template);
                }

                async connectedCallback() {
                    let self = this;
                    Array.from(self.attributes).forEach(attr => {
                        if(typeof self.variables[attr.nodeName]) {
                            self.variables[attr.nodeName] = attr.nodeValue;
                        }
                        if(attr.name === "data-presenter") {
                            self.presenter = window.webSkel.initialisePresenter(attr.nodeValue);
                            self.presenter.invalidate = () => {
                                self.presenter.beforeRender();
                                for(let vn in self.variables) {
                                    if(typeof self.presenter[vn] !== "undefined") {
                                        self.variables[vn] = self.presenter[vn];
                                    }
                                }
                                self.refresh();
                            }
                        }
                    });
                    if(!self.presenter) {
                        self.refresh();
                    }
                }

                refresh() {
                    let contentArray = this.templateArray.map((item) => {
                        if(item.startsWith("$$")) {
                            let varName = item.slice(2);
                            return this.variables[varName];
                        }
                        return item;
                    });

                    this.innerHTML = contentArray.join("");
                }
            }
        );
    };
}
export default WebSkel;