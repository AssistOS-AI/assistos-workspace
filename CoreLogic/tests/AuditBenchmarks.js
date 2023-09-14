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
        const config = {
            rootFolder: folder,
            domain,
            apiHubPort: apiHub.port
        };


        const auditSecret = crypto.getRandomSecret(12);
        const accountingSecret = crypto.getRandomSecret(12);

        try {
            const remoteAuditEnclaveDID = await tir.launchConfigurableRemoteEnclaveTestNodeAsync({
                domain,
                apihubPort: apiHub.port,
                useWorker: true,
                config: {
                    rootFolder: folder,
                    secret: auditSecret,
                    lambdas: "./CoreLogic/src/AuditEnclave",
                    name: "Audit"
                }
            });

            const remoteAccountingEnclaveDID = await tir.launchConfigurableRemoteEnclaveTestNodeAsync({
                domain,
                apihubPort: apiHub.port,
                useWorker: false,
                config: {
                    rootFolder: folder,
                    secret: accountingSecret,
                    lambdas: "./CoreLogic/src/AccountingEnclave/lambdas",
                    auditDID: remoteAuditEnclaveDID,
                    name: "Accounting"
                }
            });
            const callsNumber = 5;
            const createRemoteEnclaveClient = async () => {
                const clientSeedSSI = keySSISpace.createSeedSSI("vault", "secret");
                const clientDIDDocument = await $$.promisify(w3cDID.createIdentity)("ssi:key", clientSeedSSI);

                const accountingClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteAccountingEnclaveDID);

                accountingClient.on("initialised", async () => {

                    const promises = []
                    // for (let i = 0; i < callsNumber; i++) {
                    //     accountingClient.callLambda("helloWorldWithAudit", "param1", "param2", () => { });
                    // }
                    for (let i = 0; i < callsNumber; i++) {
                        promises.push($$.promisify(accountingClient.callLambda)("helloWorldWithAudit", "param1", "param2"));
                    }
                    const response = await Promise.all(promises);

                    const auditClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteAuditEnclaveDID);
                        auditClient.on("initialised", () => {
                            auditClient.callLambda("getAudit", (err, result) => {
                                console.log(err, result);
                                assert.true(err === undefined, "Audit lambda call failed");
                                const resultLength = JSON.parse(result).length;
                                assert.true(resultLength == callsNumber, "Audit lambda result is not as expected");
                                testFinished();
                            })
                        })

                    // const auditClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteAuditEnclaveDID);
                    // auditClient.on("initialised", () => {
                    //     let counter = 0;
                    //     const startTime = new Date().getTime();
                    //     const intervalId = setInterval(() => {
                    //         auditClient.callLambda("getAudit", (err, result) => {

                    //             if (result == undefined) return;
                    //             const resultLength = JSON.parse(result).length;
                    //             console.log("Audit registered " + resultLength + " lambda calls after " + new Date().getTime - startTime);
                    //             counter += 1;
                    //             if (counter == 10) {
                    //                 clearInterval(intervalId);
                    //                 testFinished();
                    //             }
                    //         })
                    //     }, 1000)

                    // })
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