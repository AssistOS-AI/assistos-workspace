require("../opendsu-sdk/psknode/bundles/testsRuntime");
async function boot() {
    const args = process.argv;
    let options;
    if (args.length <= 2) {
        console.error("A configuration file needs to be specified");
    }
    try {
        const fs = require('fs');
        const fileContent = fs.readFileSync(args[2]);
        options = JSON.parse(fileContent);
    } catch (err) {
        console.error(err);
    }

    try {
        console.log("process");
        process.env.REMOTE_ENCLAVE_DOMAIN = options.domain;
        process.env.REMOTE_ENCLAVE_SECRET = options.config.secret;
        const remoteEnclave = require("../opendsu-sdk/modules/remote-enclave");

        let remoteEnclaveInstance;
        const remoteEnclaveInitialised = new Promise((resolve, reject) => {
            const callback = (result) => {
                resolve(result);
            };
            remoteEnclaveInstance = remoteEnclave.createInstance(options.config);
            remoteEnclaveInstance.start();
            remoteEnclaveInstance.on("initialised", callback);
        });

        const remoteEnclaveDID = await remoteEnclaveInitialised;

        process.stdout.write("DID:" + remoteEnclaveDID);
    } catch (error) {
        console.error("Boot error", error);
    }

    process.on("uncaughtException", (error) => {
        console.error("uncaughtException inside node worker", error);
        setTimeout(() => process.exit(1), 100);
    });
}

boot();
setInterval(() => {}, 1 << 30);

