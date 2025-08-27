module.exports = {
    "name": "DefaultScript",
    "description": "DefaultScript",
    "code": `@history new Table from message timestamp role
@context new Table from message timestamp role
@currentUser := $arg1
@agentName := $arg2
@assistant new ChatAIAgent $agentName
@user new ChatUserAgent $currentUser
@chat new Chat $history $context $user $assistant
@UIContext := ""

context.upsert system [ assistant.getSystemPrompt ] "" system
@newReply macro reply ~history ~context ~chat ~assistant
    @res history.upsert $reply
    context.upsert $res
    chat.notify $res
    return $res
end`,
    "role": "guest",
    "components": [
        {
            "name": "Create Chat",
            "componentName": "create-chat"
        },
        {
            "name": "Load Chat",
            "componentName": "load-chat"
        },
        {
            "name": "Documents",
            "componentName": "documents-page"
        },
        {
            "name": "Agents",
            "componentName": "agents-page"
        },
        {
            "name": "Settings",
            "componentName": "settings-page"
        },
        {
            "name": "Applications",
            "componentName": "applications-marketplace-page"
        },
        {
            "name": "Build",
            "componentName": "build-page"
        },
        {
            "name": "Web Assistant",
            "componentName": "web-assistant"
        }
    ]
};