const getProcess = (command) => {
  const path = `${import.meta.dirname}/luuid_bin`
  if (command) {
    return Bun.spawn([path, command])
  }
  return Bun.spawn([path], { stdin: 'pipe' })
}

const runCommand = async (command, id) => {
  const process = getProcess(command, id)
  const response = await new Response(process.stdout).text()
  const res = response.slice(0, -1) // remove final \n character
  return res
}

export const luuidV2 = () => runCommand('--v2')
export const luuidParse = (id) => runCommand(`--parse=${id}`)
export const luuidAddHyphens = (id) => runCommand(`--add-hyphens=${id}`)
export const luuidRemoveHyphens = (id) => runCommand(`--remove-hyphens=${id}`)

export class LuuidGenerator {
  process
  textDecoder

  constructor () {
    this.process = getProcess()
    this.textDecoder = new TextDecoder("utf-8")
  }
  // TODO handle if process closes needs to be restarted

  readResponse = async () => {
    const { stdout } = this.process
    const reader = stdout.getReader()
    const { value } = await reader.read()
    reader.releaseLock()
    return value
  }

  execute = async (command) => {
    const { stdin } = this.process
    stdin.write(command)
    const value = await this.readResponse()
    const response = this.textDecoder.decode(value)
    const result = response.slice(0, -1) // remove final \n character
    return result
  }

  v1 = async () => {
    return this.execute('v1\n')
  }
}