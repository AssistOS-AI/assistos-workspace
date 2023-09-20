const fs = require('fs');
async function getScripts(request, response){

    // let dummyData = {scripts:[{id:"2",name:"Remove semicolon",content:"str = str.replace(\";\", \"\");"},
    //         {id:"3",name:"ParseText",content:"let prompt = \"PLease provide me with a recipe for a delicious cake\";\nlet content = callAPI(prompt);\n content=content.split(\"SEPARATOR\");"}
    //     ]};
    // try{
    //     fs.writeFileSync(`../apihub-components/space-scripts/space${request.params.currentSpaceId}.json`, JSON.stringify(dummyData));
    // }catch (error){
    //     response.statusCode = 500;
    //     response.setHeader("Content-Type", "text/html");
    //     response.write(error + " error at writing scripts dummyData");
    //     response.end();
    // }

    try {

        let data = require(`./space-scripts/space${request.params.currentSpaceId}.json`);

        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html");
        response.write(JSON.stringify(data.scripts));
        response.end();
    } catch (error) {

        response.statusCode = 500;
        response.setHeader("Content-Type", "text/html");
        response.write(error);
        response.end();
    }
}
async function addScript(request, response){

    let data = require(`./space-scripts/space${request.params.currentSpaceId}.json`);

    data.scripts.push(request.body);

    try{
        fs.writeFileSync(`../apihub-components/space-scripts/space${request.params.currentSpaceId}.json`, JSON.stringify(data));
    }
    catch (e){
        response.statusCode = 500;
        response.setHeader("Content-Type", "text/html");
        response.write(e+ ` Error at writing scripts file: ../apihub-components/space-scripts/space${request.params.currentSpaceId}.json`);
        response.end();
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(`Removed script: ${JSON.stringify(request.body)}`);
    response.end();
}

async function editScript(request, response){

    let body = [];
    let data = require(`./space-scripts/space${request.params.currentSpaceId}.json`);


    function updateScript(script, index, arr) {
        if (script.id === request.params.scriptId) {
            arr[index] = request.body;
            return true;
        }
        return false;
    }

    const updatedScript = data.scripts.filter(updateScript);

    try{
        fs.writeFileSync(`../apihub-components/space-scripts/space${request.params.currentSpaceId}.json`, JSON.stringify(data));
    }
    catch (e){
        response.statusCode = 500;
        response.setHeader("Content-Type", "text/html");
        response.write(e+ ` Error at writing scripts file: ../apihub-components/space-scripts/space${request.params.currentSpaceId}.json`);
        response.end();
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(`updated script: ${JSON.stringify(updatedScript)}`);
    response.end();
}

async function deleteScript(request, response){
    //__dirname is opendsu-sdk
    let data = require(`./space-scripts/space${request.params.currentSpaceId}.json`);
    function deleteScript(script, index, arr) {
        if (script.id === request.params.scriptId) {
            arr.splice(index, 1);
            return true;
        }
        return false;
    }

    const removedScript = data.scripts.filter(deleteScript);

    try{
        fs.writeFileSync(`../apihub-components/space-scripts/space${request.params.currentSpaceId}.json`, JSON.stringify(data));
    }
    catch (e){
        response.statusCode = 204;
        response.setHeader("Content-Type", "text/html");
        response.write(e+`Error at writing scripts file: ../apihub-components/space-scripts/space${request.params.currentSpaceId}.json`);
        response.end();
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html");
    response.write(`Removed script: ${JSON.stringify(removedScript)}`);
    response.end();
}

module.exports = {
    getScripts,
    addScript,
    editScript,
    deleteScript
};