global.$$ = {};

$$.plugins = {
    "ChatPlugin": require('../../workspacePlugins/ChatPlugin.js'),
    "AgentWrapper":{},
    "WorkspacePlugin":{},
    "LLM":{}
}

$$.loadPlugin = async function (pluginName) {
    if (!$$.plugins[pluginName]) {
        const error = `Module "${pluginName}" not defined. Available plugins are: ${Object.keys($$.plugins).map(k => `"${k}"`).join(', ')}`
        throw new Error(error)
    }
    return $$.plugins[pluginName]
}


const { getInstance } = require('../../workspacePlugins/ChatPlugin.js');

async function test(name, fn) {
    try {
        await fn();
        console.log(`✔️ Passed: ${name}`);
    } catch (error) {
        console.error(`❌ Failed: ${name}\n${error}`);
    }
}

async function runAll() {
    const chat = await getInstance();

    await test('createChat()', async () => {
        const chatId = await chat.createChat('testDoc');
        if (!chatId) throw 'Chat creation failed';
    });

    await test('getChat()', async () => {
        const chatId = await chat.createChat('testDoc2');
        const retrieved = await chat.getChat(chatId);
        if (retrieved.id !== chatId) throw 'getChat mismatch';
    });

    await test('addPreferenceToContext()', async () => {
        const chatId = await chat.createChat('testDoc3');
        await chat.addPreferenceToContext(chatId, "Preference A");
        const ctx = await chat.getChatContext(chatId);
        if (!ctx.some(p => p.text === "Preference A")) throw 'Preference not added';
    });

    await test('sendMessage()', async () => {
        const chatId = await chat.createChat('testDoc4');
        await chat.sendMessage(chatId, 'user1', 'Hello', 'user');
        const msgs = await chat.getChatMessages(chatId);
        if (!msgs.some(m => m.text === 'Hello')) throw 'Message not sent';
    });

    await test('resetChat()', async () => {
        const chatId = await chat.createChat('testDoc5');
        await chat.sendMessage(chatId, 'user1', 'Hello', 'user');
        await chat.resetChat(chatId);
        const msgs = await chat.getChatMessages(chatId);
        const ctx = await chat.getChatContext(chatId);
        if (msgs.length || ctx.length) throw 'Chat not reset properly';
    });

    await test('deleteChat()', async () => {
        const chatId = await chat.createChat('testDoc6');
        await chat.deleteChat(chatId);
        try {
            await chat.getChat(chatId);
            throw 'Chat still exists after deletion';
        } catch (e) {}
    });
}

module.exports = { runAll };
