function Brand(server) {
    const { getBrandsPage } = require("./controller");

    server.get("/:domain/brands", getBrandsPage);
}

module.exports = Brand;
