module.exports = {
    supportedAPIKeyTypes: [
        "OpenAI",
        "Google",
        "Meta",
        "Microsoft",
        "Anthropic"
    ],
    spaceRoles: {
        Owner: "owner",
        Admin: "admin",
        Collaborator: "collaborator",
        Auditor: "auditor",
        Viewer: "viewer"
    },
    defaultPersonality:"Assistant",
}