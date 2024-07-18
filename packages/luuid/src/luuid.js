const runCommand = async (command, id) => {
  const process = Bun.spawn(['bin/luuid_process', `--${command}=${id}`])
  const response = await new Response(process.stdout).text()
  const res = response.slice(0, -1) // remove final \n character
  return res
}

export const luuid_v2 = () => runCommand('v2')
export const luuid_parse = (id) => runCommand('parse', id)
export const luuid_add_hyphens = (id) => runCommand('add_hyphens', id)
export const luuid_remove_hyphens = (id) => runCommand('remove_hyphens', id)

export class Luuid {
  process
  textDecoder

  constructor () {
    this.process = Bun.spawn(['bin/luuid_process'], {
      stdin: 'pipe',
    })
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