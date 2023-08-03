require("../../opendsu-sdk/psknode/bundles/testsRuntime");

const dc = require("double-check");
const assert = dc.assert;


assert.callback('Create accounting enclave test', (testFinished) => {
    const openDSU = require("opendsu");
    const fast = openDSU.loadApi("svd");
    console.log(fast);
    testFinished();
}, 500000);