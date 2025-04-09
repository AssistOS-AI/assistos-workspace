const {spawn} = require('child_process')

const composeBinaryPath = (binary) =>`../binaries/${binary}/bin/${binary}`

async function BinariesExecutor() {
    const self = {}

    self.executeBinary = (binary, args = []) => {
        return new Promise((resolve, reject) => {
            const proc = spawn(composeBinaryPath(binary), args)
            let output = ''
            let errorOutput = ''

            proc.stdout.on('data', data => output += data)
            proc.stderr.on('data', data => errorOutput += data)

            proc.on('close', code => {
                if (code === 0) resolve(output.trim())
                else reject(new Error(errorOutput.trim()))
            })
        })
    }
    self.executeBinaryStreaming = (binary, args = [], onDataChunk) => {
        return new Promise((resolve, reject) => {
            const proc = spawn(composeBinaryPath(binary), args)

            proc.stdout.on('data', data => onDataChunk(data.toString()))
            proc.stderr.on('data', data => reject(new Error(data.toString().trim())))

            proc.on('close', code => {
                if (code === 0) resolve()
            })
        })
    }

    return self
}

let singletonInstance;

module.exports = {
    getInstance: async function () {
        if (!singletonInstance) {
            singletonInstance = await BinariesExecutor();
        }
        return singletonInstance;
    },
    getAllow: function () {
        return async function (globalUserId, email, command, ...args) {
            return true;
        }
    },
    getDependencies: function () {
        return [];
    }
}