require("../../opendsu-sdk/builds/output/testsRuntime");
const tir = require("../../opendsu-sdk/psknode/tests/util/tir");

const dc = require("double-check");
const assert = dc.assert;
const openDSU = require("opendsu");
const keySSISpace = openDSU.loadAPI("keyssi");
const scAPI = openDSU.loadApi("sc");
const w3cDID = openDSU.loadAPI("w3cdid");
const enclaveAPI = openDSU.loadAPI("enclave");
const crypto = openDSU.loadAPI("crypto");

assert.callback('Create accounting enclave test', (testFinished) => {
    dc.createTestFolder('createDSU', async (err, folder) => {
        const testDomainConfig = {
            "anchoring": {
                "type": "FS",
                "option": {}
            },
            "enable": ["enclave", "mq"]
        }

        const domain = "vault";
        const apiHub = await tir.launchConfigurableApiHubTestNodeAsync({
            domains: [{
                name: domain,
                config: testDomainConfig
            }],
            rootFolder: folder
        });

        const enclaveSecret = crypto.getRandomSecret(12);
        try {
            const remoteAccountingEnclaveDID = await tir.launchConfigurableRemoteEnclaveTestNodeAsync({
                domain,
                apihubPort: apiHub.port,
                useWorker: false,
                config: {
                    rootFolder: folder,
                    secret: enclaveSecret,
                    lambdas: "./CoreLogic/src/AccountingEnclave/lambdas"
                }
            });

            const createRemoteEnclaveClient = async () => {
                const clientSeedSSI = keySSISpace.createSeedSSI("vault", "some secret");
                const clientDIDDocument = await $$.promisify(w3cDID.createIdentity)("ssi:key", clientSeedSSI);

                const remoteEnclaveClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteAccountingEnclaveDID);
                remoteEnclaveClient.on("initialised", async () => {
                    remoteEnclaveClient.callLambda("helloWorld", "param1", "param2", (err, result) => {
                        console.log(err, result);
                        assert.true(err === undefined, "Lambda call failed");
                        assert.equal(`["param1","param2"]`, result, "Lambda result is not as expected");
                        testFinished();
                    })
                });
            }

            const sc = scAPI.getSecurityContext();
            if (sc.isInitialised()) {
                return await createRemoteEnclaveClient();
            }
            sc.on("initialised", async () => {
                await createRemoteEnclaveClient();
            });

        }
        catch (err) {
            console.log(err);
        }
    })

}, 500000);