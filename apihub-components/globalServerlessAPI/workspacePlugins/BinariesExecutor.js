const {spawn} = require('child_process')
const path = require('path')

const composeBinaryPath = (binary) => path.resolve(process.env.PERSISTENCE_FOLDER,`../binaries/${binary}.js`);

async function BinariesExecutor() {
    const self = {}

    self.executeBinary = (binary, args = []) => {
        return new Promise((resolve, reject) => {
            //const proc = spawn(composeBinaryPath(binary), args)
            const path = composeBinaryPath(binary)
            const proc = spawn('node', [path, ...args])
            let output = ''
            let errorOutput = ''

            proc.stdout.on('data', data => {
                output += data;
                console.log(`Output: ${data.toString().trim()}`)
            });
            proc.stderr.on('data', data => {errorOutput += data;
                console.error(`Error: ${data.toString().trim()}`)
            })

            proc.on('close', code => {
                if (code === 0) resolve(output.trim())
                else reject(new Error(errorOutput.trim()))
            })
        })
    }
    self.executeBinaryStreaming = (binary, args = [], onDataChunk) => {
        return new Promise((resolve, reject) => {
            const path = composeBinaryPath(binary)
            const proc = spawn('node', [path, ...args])
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