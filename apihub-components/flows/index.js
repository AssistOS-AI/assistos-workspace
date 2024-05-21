const {
    loadFlows,
    getFlow,
    addFlow,
    updateFlow,
    deleteFlow,
    callFlow
} = require('./controller');
const authentication = require("../apihub-component-middlewares/authentication");
const bodyReader = require("../apihub-component-middlewares/bodyReader");
function Flows(server){
    server.use("/flows/*", authentication);
    server.use("/flows/*", bodyReader);
    server.get("/flows/:spaceId", loadFlows);
    server.get("/flows/:spaceId/:flowName", getFlow);
    server.post("/flows/:spaceId/:flowName", addFlow);
    server.put("/flows/:spaceId/:flowName", updateFlow);
    server.delete("/flows/:spaceId/:flowName", deleteFlow);
    server.post("/flows/call/:spaceId/:flowName", callFlow);
}
module.exports = Flows;