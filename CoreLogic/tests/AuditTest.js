require("../../opendsu-sdk/psknode/bundles/testsRuntime");
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

            const createRemoteEnclaveClient = async () => {
                const clientSeedSSI = keySSISpace.createSeedSSI("vault", "secret");
                const clientDIDDocument = await $$.promisify(w3cDID.createIdentity)("ssi:key", clientSeedSSI);

                const accountingClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteAccountingEnclaveDID);

                accountingClient.on("initialised", async () => {
                    accountingClient.callLambda("helloWorldWithAudit", "param1", "param2", (err, result) => {
                        console.log(err, result);
                        assert.true(err === undefined, "Lambda call failed");
                        assert.equal(`["param1","param2"]`, result, "Lambda result is not as expected");

                        const auditClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteAuditEnclaveDID);
                        auditClient.on("initialised", () => {
                            auditClient.callLambda("getAudit", (err, result) => {
                                console.log(err, result);
                                assert.true(err === undefined, "Audit lambda call failed");
                                const resultLength = JSON.parse(result).length;
                                assert.true(resultLength == 1, "Audit lambda result is not as expected");
                                testFinished();
                            })
                        })

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