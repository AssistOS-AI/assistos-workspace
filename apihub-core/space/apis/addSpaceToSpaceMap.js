const path = require('path');
const fsPromises = require('fs').promises;

const {
    SPACE_MAP_PATH,
} = require('../../../config.json');



module.exports = addSpaceToSpaceMap;