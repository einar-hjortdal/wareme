const spawnProcess = (inputPath, command) => {
  if (!inputPath) {
    return new Error('inputPath must be provided')
  }

  const path = `${import.meta.dirname}/markdown_bin`
  if (command) {
    return Bun.spawn([path, inputPath, command])
  }

  return Bun.spawn([path, inputPath])
}

const runCommand = async (inputPath, command) => {
  const process = spawnProcess(inputPath, command)
  const response = await new Response(process.stdout).text()
  const res = response.slice(0, -1) // remove final \n character
  return res
}

export const parse = (inputPath) => runCommand(inputPath)
export const parseTo = (inputPath, outputPath) => runCommand(inputPath, `--out=${outputPath}`)