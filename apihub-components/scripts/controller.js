async function getScripts(request, response){
    const workspaceId  = request.params.currentCompanyId;
    try {

        let data = require(`./workspace-scripts/workspace${workspaceId}.json`);

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
module.exports = {
    getScripts,
};