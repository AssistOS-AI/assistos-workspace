#!/usr/bin/env node

const OpenAI = require('openai')
const { Command } = require('commander')

const openaiCmd = new Command()

const addCommonOptions = (cmd) =>
    cmd
        .requiredOption('-k, --key <apiKey>')
        .requiredOption('-m, --model <model>')
        .requiredOption('-p, --prompt <prompt>')
        .option('--temperature <temperature>', parseFloat)
        .option('--top_p <top_p>', parseFloat)
        .option('--frequency_penalty <frequency_penalty>', parseFloat)
        .option('--presence_penalty <presence_penalty>', parseFloat)
        .option('--stop <stop>')
        .option('--max_tokens <max_tokens>', parseInt)

openaiCmd
    .command('generateText')
    .description('Use /v1/completions (text-* models)')
    .hook('preAction', (thisCmd, actionCommand) => {
        actionCommand.endpoint = 'completions'
        actionCommand.stream = false
    })
    .action(handleText)

openaiCmd
    .command('generateTextStreaming')
    .description('Use /v1/completions with stream (text-* models)')
    .hook('preAction', (thisCmd, actionCommand) => {
        actionCommand.endpoint = 'completions'
        actionCommand.stream = true
    })
    .action(handleText)

openaiCmd
    .command('getChatCompletion')
    .description('Use /v1/chat/completions (chat models)')
    .hook('preAction', (thisCmd, actionCommand) => {
        actionCommand.endpoint = 'chat'
        actionCommand.stream = false
    })
    .action(handleChat)

openaiCmd
    .command('getChatCompletionStreaming')
    .description('Use /v1/chat/completions with stream (chat models)')
    .hook('preAction', (thisCmd, actionCommand) => {
        actionCommand.endpoint = 'chat'
        actionCommand.stream = true
    })
    .action(handleChat)

addCommonOptions(openaiCmd.commands[0])
addCommonOptions(openaiCmd.commands[1])
addCommonOptions(openaiCmd.commands[2])
addCommonOptions(openaiCmd.commands[3])

async function handleText(opts, cmd) {
    const openai = new OpenAI({ apiKey: opts.key })

    const params = {
        model: opts.model,
        prompt: opts.prompt,
        temperature: opts.temperature,
        top_p: opts.top_p,
        frequency_penalty: opts.frequency_penalty,
        presence_penalty: opts.presence_penalty,
        stop: opts.stop,
        max_tokens: opts.max_tokens,
        stream: cmd.stream
    }

    try {
        if (cmd.stream) {
            const stream = await openai.completions.create(params)
            for await (const chunk of stream) {
                process.stdout.write(chunk.choices[0]?.text || '')
            }
        } else {
            const completion = await openai.completions.create(params)
            process.stdout.write(completion.choices[0]?.text || '')
        }
    } catch (err) {
        process.stderr.write(`\nERROR: ${err.message}\n`)
        process.exit(1)
    }
}

async function handleChat(opts, cmd) {
    const openai = new OpenAI({ apiKey: opts.key })

    const params = {
        model: opts.model,
        messages: [{ role: 'user', content: opts.prompt }],
        temperature: opts.temperature,
        top_p: opts.top_p,
        frequency_penalty: opts.frequency_penalty,
        presence_penalty: opts.presence_penalty,
        stop: opts.stop,
        max_tokens: opts.max_tokens,
        stream: cmd.stream
    }

    try {
        if (cmd.stream) {
            const stream = await openai.chat.completions.create(params)
            for await (const chunk of stream) {
                process.stdout.write(chunk.choices[0]?.delta?.content || '')
            }
        } else {
            const completion = await openai.chat.completions.create(params)
            process.stdout.write(completion.choices[0]?.message?.content || '')
        }
    } catch (err) {
        process.stderr.write(`\nERROR: ${err.message}\n`)
        process.exit(1)
    }
}

openaiCmd.parse(process.argv)
