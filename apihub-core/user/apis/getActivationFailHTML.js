const activationSuccessTemplate = require('../../htmlexporter.js')
('activationFailTemplate')

const templateReplacer_$$ = require('../../exporter.js')
('templateReplacer_$$')

const {ENVIRONMENT_MODE, PRODUCTION_BASE_URL, DEVELOPMENT_BASE_URL} = require('../../../config.json')

async function getActivationFailHTML(failReason) {
    let redirectURL = ENVIRONMENT_MODE === 'development' ? DEVELOPMENT_BASE_URL : PRODUCTION_BASE_URL

    return templateReplacer_$$(activationSuccessTemplate, {
        redirectURL: redirectURL,
        failReason: failReason
    })
}

module.exports = getActivationFailHTML