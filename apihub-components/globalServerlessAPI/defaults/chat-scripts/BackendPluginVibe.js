module.exports = {
    "name": "BackendPluginVibe",
    "description": "BackendPluginVibe",
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
            "name": "Backend Plugins",
            "componentName": "achilles-ide-backend-plugin-edit"
        }
    ]
};