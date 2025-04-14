const { getInstance } = require('../../workspacePlugins/WebAssistant.js');

async function test(name, fn) {
    try {
        await fn();
        console.log(`✔️ Passed: ${name}`);
    } catch (error) {
        console.error(`❌ Failed: ${name}\n${error}`);
    }
}

async function runAll() {
    const assistant = await getInstance();

    await test('addWebChatTheme()', async () => {
        const theme = await assistant.addWebChatTheme({ name: 'Test', description: 'Desc', theme: {} });
        if (!theme.id) throw 'Theme creation failed';
    });

    await test('getWebChatTheme()', async () => {
        const theme = await assistant.addWebChatTheme({ name: 'Test2', description: 'Desc', theme: {} });
        const retrieved = await assistant.getWebChatTheme(theme.id);
        if (retrieved.id !== theme.id) throw 'Retrieved wrong theme';
    });

    await test('updateWebChatTheme()', async () => {
        const theme = await assistant.addWebChatTheme({ name: 'Test3', description: 'Desc', theme: {} });
        await assistant.updateWebChatTheme(theme.id, { description: 'Updated' });
        const updated = await assistant.getWebChatTheme(theme.id);
        if (updated.description !== 'Updated') throw 'Theme not updated';
    });

    await test('deleteWebAssistantTheme()', async () => {
        const theme = await assistant.addWebChatTheme({ name: 'Test4', description: 'Desc', theme: {} });
        await assistant.deleteWebAssistantTheme(theme.id);
        try {
            await assistant.getWebChatTheme(theme.id);
            throw 'Theme not deleted';
        } catch (e) {}
    });

    await test('addWebAssistantConfigurationPage()', async () => {
        const page = await assistant.addWebAssistantConfigurationPage({
            name: "Home", description: "Main", pageType: "home", pageContent: {}
        });
        if (!page.id) throw 'Page creation failed';
    });

    await test('deleteWebAssistantConfigurationPage()', async () => {
        const page = await assistant.addWebAssistantConfigurationPage({
            name: "Home2", description: "Main", pageType: "home", pageContent: {}
        });
        await assistant.deleteWebAssistantConfigurationPage(page.id);
        const pages = await assistant.getWebAssistantConfigurationPages();
        if (pages.some(p => p.id === page.id)) throw 'Page not deleted';
    });
}

module.exports = { runAll };
