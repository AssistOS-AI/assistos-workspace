require("../../opendsu-sdk/builds/output/testsRuntime");

const dc = require("double-check");
const assert = dc.assert;


assert.callback('Create accounting enclave test', (testFinished) => {
    const openDSU = require("opendsu");
    const fast = openDSU.loadApi("svd");
    console.log(fast);
    testFinished();
}, 500000);