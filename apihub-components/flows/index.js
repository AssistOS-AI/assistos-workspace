const {
    listFlows,
    getFlow,
    callFlow
} = require('./controller');
const authentication = require("../apihub-component-middlewares/authentication");
const bodyReader = require("../apihub-component-middlewares/bodyReader");
function Flows(server){
    server.use("/flows/*", authentication);
    server.use("/flows/*", bodyReader);
    server.get("/flows/list", listFlows);
    server.get("/flows/:spaceId/:flowName", getFlow);
    server.post("/flows/call/:spaceId/:flowName", callFlow);
}
module.exports = Flows;