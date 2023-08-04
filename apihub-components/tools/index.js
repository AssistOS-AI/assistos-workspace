function Tool(server) {
    const { getToolPage } = require("./controller");

    server.get("/:domain/tool/:toolId", getToolPage);
}

module.exports = Tool;
