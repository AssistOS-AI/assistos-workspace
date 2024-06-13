const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class ChangeApplication extends IFlow {
    static flowMetadata = {
        action: "Changes the current application",
        intent: "Change the current application",
    };

    static flowParametersSchema = {
        pageId: {
            type: "string",
            required: true
        },
        refreshFlag: {
            type: "string",
            required: false
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            if (parameters.refreshFlag === '0') {
                if (parameters.pageId === window.location.hash.slice(1)) {
                    return;
                }
            }

            assistOS.changeSelectedPageFromSidebar(parameters.pageId);

            if (parameters.pageId.startsWith("space")) {
                let page = parameters.pageId.split("/")[1];
                await assistOS.UI.changeToDynamicPage(page, parameters.pageId);
            } else {
                await assistOS.UI.changeToDynamicPage(parameters.pageId, parameters.pageId);
            }

            apis.success(parameters.pageId);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = ChangeApplication;
