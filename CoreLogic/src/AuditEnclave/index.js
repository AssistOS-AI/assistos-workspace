
function addAudit(...args) {
    const swarmUtils = require("swarmutils");
    const uuid = swarmUtils.generateUid(32).toString("hex");
    const callback = args.pop();
    const enclaveName = args.pop();
    this.insertRecord("", "auditLogs", uuid, {args: args, enclaveName: enclaveName}, (err, res)=>{
        callback(err, res);
    })
}

function getAudit(callback) { 
    this.getAllRecords("", "auditLogs", (err, res)=>{
        callback(err, res);
    })
}

module.exports = {
    registerLambdas: function (remoteEnclaveServer) {
        remoteEnclaveServer.addEnclaveMethod("addAudit", addAudit, "read");
        remoteEnclaveServer.addEnclaveMethod("getAudit", getAudit, "read");
    }
}