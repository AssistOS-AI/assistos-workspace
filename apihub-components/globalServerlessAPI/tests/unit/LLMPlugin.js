async function test(name, fn) {
    try {
        await fn();
        console.log(`✔️ Passed: ${name}`);
    } catch (error) {
        console.error(`❌ Failed: ${name}\n${error}`);
    }
}

async function runAll() {
    const llmPlugin = await global.$$.loadPlugin('LLM')
    const LLM = await llmPlugin.getInstance();
    const key = '';

    const prompt = "What's 2+2?"
    const messages = [{role: 'user', content: prompt}]

    await test('getTextResponse', async () => {
        const res = await LLM.getTextResponse('openai', key, 'davinci-002', 'Say hello')
        if (typeof res !== 'string') throw new Error('No valid response')
    })
}

module.exports = {runAll};