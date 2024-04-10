const activationSuccessTemplate = require('../../htmlexporter.js')
('activationSuccessTemplate')

const templateReplacer_$$ = require('../../exporter.js')
('templateReplacer_$$')

const {ENVIRONMENT_MODE, PRODUCTION_BASE_URL, DEVELOPMENT_BASE_URL} = require('../../../config.json')

async function getActivationSuccessHTML() {
    let loginRedirectURL = ENVIRONMENT_MODE === 'development' ? DEVELOPMENT_BASE_URL : PRODUCTION_BASE_URL
    return templateReplacer_$$(activationSuccessTemplate, {
        loginRedirectURL: loginRedirectURL
    })
}

module.exports = getActivationSuccessHTML