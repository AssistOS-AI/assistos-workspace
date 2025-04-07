const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.question(`Which test suite to run? (chat/web/all): `, async (suite) => {
    if (suite.toLowerCase() === 'chat') {
        await require('./chatPlugin.js').runAll();
    } else if (suite.toLowerCase() === 'web') {
        await require('./webAssistantPlugin.js').runAll();
    } else if (suite.toLowerCase() === "all") {
        await require('./chatPlugin.js').runAll();
        await require('./webAssistantPlugin.js').runAll();
    } else {
        console.log('Invalid suite choice');
    }
    readline.close();
});