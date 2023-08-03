function helloWorld (...args) {
    const callback = args.pop();
    callback(undefined, args);
}

function helloWorldWithAudit (...args) {
    const callback = args.pop();
    this.audit(...args);
    callback(undefined, args);
}

module.exports = {
    registerLambdas: async (remoteEnclaveServer) => {
        remoteEnclaveServer.addEnclaveMethod("helloWorld", helloWorld, "read");
        remoteEnclaveServer.addEnclaveMethod("helloWorldWithAudit", helloWorldWithAudit, "read");
    }
}