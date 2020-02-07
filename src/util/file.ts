import { ArbValue } from 'arb-provider-ethers'
import { DropEvent } from 'react-dropzone'
function readFileAsync(file: File): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    var reader = new FileReader()
    reader.onload = () => {
      if (reader.result) {
        let buf = reader.result as ArrayBuffer
        resolve(new Uint8Array(buf))
      }
    }
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.readAsArrayBuffer(file)
  })
}

export async function getContractHash(files: File[]): Promise<string> {
  if (files.length === 0) {
    throw Error('No files')
  }
  const data = await readFileAsync(files[0])
  return ArbValue.contractMachineHash(data)
}
