const {getAccountingPage} = require("../accounting/controller");

function Account(server) {
    const { getAccountingPage } = require("./controller");

    server.get("/accounting/:action", getAccountingPage);
}


module.exports = Account;