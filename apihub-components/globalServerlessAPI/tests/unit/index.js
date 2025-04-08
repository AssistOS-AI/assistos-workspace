const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

global.$$ = {};

$$.plugins = {
    "ChatPlugin": require('../../workspacePlugins/ChatPlugin.js'),
    "AgentWrapper": require('../../workspacePlugins/AgentWrapper.js'),
    "Workspace": require('../../workspacePlugins/AgentWrapper.js'),
    "LLM": require('../../workspacePlugins/LLM.js'),
    "BinariesExecutor":require('../../workspacePlugins/BinariesExecutor.js'),
}

$$.loadPlugin = async function (pluginName) {

    if (!$$.plugins[pluginName]) {
        const error = `Module "${pluginName}" not defined. Available plugins are: ${Object.keys($$.plugins).map(k => `"${k}"`).join(', ')}`
        throw new Error(error)
    }
    return $$.plugins[pluginName]
}

readline.question(`Which test suite to run? (chat/web/llm/all): `, async (suite) => {

    if (suite.toLowerCase() === 'chat') {
        await require('./chatPlugin.js').runAll();
    } else if (suite.toLowerCase() === 'web') {
        await require('./webAssistantPlugin.js').runAll();
    } else if (suite.toLowerCase() === 'llm') {
        await require('./LLMPlugin').runAll();
    } else if (suite.toLowerCase() === "all") {
        await require('./chatPlugin.js').runAll();
        await require('./webAssistantPlugin.js').runAll();
        await require('./LLMPlugin').runAll();
    } else {
        console.log('Invalid suite choice');
    }
    readline.close();
});