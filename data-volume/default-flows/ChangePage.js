const IFlow = require('assistos').loadModule('flow', {}).IFlow;

class ChangePage extends IFlow {
    static flowMetadata = {
        action: "Redirects you to a page",
        intent: "Redirect to a specified page",
    };

    static flowParametersSchema = {
        pageHtmlTagName: {
            type: "string",
            required: true
        },
        url: {
            type: "string",
            required: true
        },
        dataPresenterParams: {
            type: "object",
            required: false
        },
        skipHistoryState: {
            type: "boolean",
            required: false
        }
    };

    constructor() {
        super();
    }

    async userCode(apis, parameters) {
        try {
            await assistOS.UI.changeToDynamicPage(parameters.pageHtmlTagName, parameters.url, parameters.dataPresenterParams, parameters.skipHistoryState);
            apis.success(parameters.pageHtmlTagName);
        } catch (e) {
            apis.fail(e);
        }
    }

}

module.exports = ChangePage;
