// const logger = $$.getLogger("tool", "apihub-components");
// const openDSU = require("opendsu");
//
// const getSc = async () => {
//     return new Promise((resolve, reject) => {
//         const sc = openDSU.loadAPI("sc").getSecurityContext();
//         if (sc.isInitialised()) {
//             resolve(sc);
//         }
//         else {
//             sc.on("initialised", (err) => {
//                 if (err) {
//                     reject(err);
//                 }
//                 resolve(sc);
//             })
//         }
//     })
// }
//
// const getRemoteEnclaveClient = async () => {
//     if (!$$.remoteEnclaveClient) {
//         await getSc();
//         const w3cDID = openDSU.loadAPI("w3cdid");
//         const enclaveAPI = openDSU.loadAPI("enclave");
//
//         const remoteDID = "did:ssi:name:vault:BrandEnclave";
//         const clientDIDDocument = await $$.promisify(w3cDID.resolveNameDID)("vault", "clientEnclaveApihub", "topSecretApihub");
//         logger.info("Client apihub enclave: " + clientDIDDocument.getIdentifier());
//         $$.remoteEnclaveClient = enclaveAPI.initialiseRemoteEnclave(clientDIDDocument.getIdentifier(), remoteDID);
//     }
//     return $$.remoteEnclaveClient;
// }
//
// const getAllBrands = async function () {
//     try {
//         const remoteEnclaveClient = await getRemoteEnclaveClient();
//         return await $$.promisify(remoteEnclaveClient.getAllRecords)("", "brands");
//     }
//     catch (err) {
//         logger.error("Error at initialising remote client" + err);
//         return undefined;
//     }
// }
//
// const getAllBrandsFollow = async function () {
//     try {
//         const remoteEnclaveClient = await getRemoteEnclaveClient();
//         return await $$.promisify(remoteEnclaveClient.getAllRecords)("", "brandsFollow");
//     }
//     catch (err) {
//         logger.error("Error at initialising remote client" + err);
//         return undefined;
//     }
// }
//

//
// async function getToolPage(request, response) {
//     const { domain, toolId } = request.params;
//     logger.debug(`Getting page for domain ${domain} and tool ${toolId}...`);
//
//     let toolPage = "";
//
//     let llmsArray = "";
//
//     let llm1 = {
//         "primary-key" : "",
//         "name" : "Machin1.0",
//         "key" : "Webfdbefudh222",
//         "url" : "www.reddit.com/r..."
//     };
//
//     let llms = [];
//
//     for(let iterator= 0; iterator < 3; iterator++) {
//         llms[iterator] = { ...llm1 }; //o copie a obiectului llm1
//         llms[iterator].primaryKey = "key-"+iterator;
//     }
//
//     for(let iterator= 0; iterator < llms.length; iterator++) {
//         llmsArray += getTableLLMRow(llms[iterator]);
//     }
//
//     toolPage += `
//                    <div class="title-container">LLMS tool ${toolId}</div>
//                             <div class="add-button-section">
//                                 <div class="add-button" data-action="showAddLLMModal">
//                                     <img src="assets/icons/Vector.png" alt="Add icon" class="add-icon">
//                                     Add LLM
//                                 </div>
//                             </div>
//                             <div class="table">
//                                 <div class="table-header">
//                                     <div class="cell">NAME</div>
//                                     <div class="cell">KEY</div>
//                                     <div class="cell">URL</div>
//                                     <div class="action-cell"> </div>
//                                 </div>
//                                 <div class="llm-list">
//                                     ${llmsArray}
//                                 </div>
//                             </div>
//                          </div>
//                   `
//     response.statusCode = 200;
//     response.setHeader("Content-Type", "text/html");
//     response.write(toolPage);
//     response.end();
// }
//
// module.exports = {
//     getToolPage,
// };
