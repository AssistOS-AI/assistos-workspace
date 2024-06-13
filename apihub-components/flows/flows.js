const fsPromises = require('fs').promises;
const path = require('path');
const volumeManager = require('../volumeManager.js');
const esprima = require('esprima');

async function getSpaceFlows(spaceId) {
    const flowsPath = path.join(volumeManager.paths.space, `${spaceId}/flows`);
    const files = await fsPromises.readdir(flowsPath);
    const flows = {};
    for (const file of files) {
        const flowName = file.replace('.js', '');
        flows[flowName] = path.join(flowsPath, file);
    }
    return flows;
}

function validateJavaScriptSyntax(code) {
    try {
        esprima.parseScript(code);
        return true;
    } catch (e) {
        console.error('Syntax error:', e.message);
        return false;
    }
}

async function addFlow(spaceId, flowData) {
    const flows = await getSpaceFlows(spaceId);
    if (flows[flowData.name]) {
        const error = new Error("Flow already exists");
        error.statusCode = 429;
        throw error;
    }

    if (!validateJavaScriptSyntax(flowData.code)) {
        const error = new Error("Invalid JavaScript syntax");
        error.statusCode = 400;
        throw error;
    }

    const flowPath = path.join(volumeManager.paths.space, `${spaceId}/flows/${flowData.name}.js`);
    const flowContent = generateFlowContent(flowData);

    await fsPromises.writeFile(flowPath, flowContent);
    return {
        success: true,
        message: "Flow added successfully"
    };
}

function generateFlowContent(flowData) {
    return `
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.${flowData.name} = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    const IFlow = require('assistos').loadModule('flow').IFlow;
    
    class ${flowData.name} extends IFlow {
        static flowMetadata = {
            action: "${flowData.action}",
            intent: "${flowData.intent}",
        };

        static flowParametersSchema = ${JSON.stringify(flowData.flowParametersSchema, null, 4)};

        constructor() {
            super(${flowData.name});
        }

        async userCode(apis, parameters) {
            ${flowData.code}
        }
    }

    return ${flowData.name};
}));
`;
}

module.exports = {
    APIs: {
        addFlow
    }
}
