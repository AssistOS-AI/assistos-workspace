const {spawn} = require('child_process')

const executeBinary = async function (binary,path, args = []){
    return new Promise((resolve, reject) => {
        //const proc = spawn(composeBinaryPath(binary), args)
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
const executeBinaryStreaming = async function (binary, path,args = [], onDataChunk) {
    return new Promise((resolve, reject) => {
        const proc = spawn('node', [path, ...args])
        proc.stdout.on('data', data => onDataChunk(data.toString()))
        proc.stderr.on('data', data => reject(new Error(data.toString().trim())))

        proc.on('close', code => {
            if (code === 0) resolve()
        })
    })
}
module.exports= {
    executeBinary,
    executeBinaryStreaming
}
