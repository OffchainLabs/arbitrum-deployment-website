import React from 'react'
import { ArbValue, ArbFactoryFactory } from 'arb-provider-ethers'
import { ArbFactory } from 'arb-provider-ethers/dist/lib/abi/ArbFactory'
import { useDropzone } from 'react-dropzone'
import styles from './App.module.scss'
import {
  Button,
  ButtonProps,
  ButtonGroup,
  Card,
  FormControl,
  InputGroup
} from 'react-bootstrap'

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
      console.log(reader.error)
    }
    reader.readAsArrayBuffer(file)
  })
}

function readContractFile(): Promise<void> {
  let input = document.getElementById('inputFile') as HTMLInputElement
  if (input.files && input.files[0]) {
    return readFileAsync(input.files[0]).then(data => {
      let machineHash = ArbValue.contractMachineHash(data)
      console.log('machine hash', machineHash)
    })
  }
  throw Error("Couldn't read file")
}

const mergeStyles = (...styles: string[]): string => styles.join(' ')

const groupButtonStyle: ButtonProps = {
  variant: 'info'
}

const App = () => {
  const { getRootProps, getInputProps } = useDropzone({ accept: '.ao' })

  return (
    <div className={styles.rootContainer}>
      <div className={mergeStyles(styles.baseTitle, styles.title)}>
        Arbitrum Rollup Chain Creator
      </div>

      <div>
        <div className={mergeStyles(styles.baseTitle, styles.subtitle)}>
          Contract Upload
        </div>
        <Card className={styles.dndContainer} {...getRootProps()}>
          <input {...getInputProps()} />
          <Card.Body>Drag and drop a contract file (*.ao only!)</Card.Body>
        </Card>
      </div>

      <div className={mergeStyles(styles.baseTitle, styles.subtitle)}>
        Chain Parameters
      </div>

      <div className={styles.presetsContainer}>
        <span>Presets</span>
        <ButtonGroup>
          <Button {...groupButtonStyle}>Blank</Button>
          <Button {...groupButtonStyle}>Local testing</Button>
        </ButtonGroup>
      </div>

      <div className={styles.chainParamsForm}>
        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Machine Hash</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl type={'text'} />
        </InputGroup>

        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Stake requirement (ETH)</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl type={'text'} />
        </InputGroup>

        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Grace period (seconds)</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl type={'text'} />
        </InputGroup>

        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Arb Gas Speed</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl type={'text'} />
        </InputGroup>

        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Max steps</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl type={'text'} />
        </InputGroup>

        <InputGroup>
          <InputGroup.Prepend>
            <InputGroup.Text>Max time bounds width (blocks)</InputGroup.Text>
          </InputGroup.Prepend>
          <FormControl type={'text'} />
        </InputGroup>
      </div>

      <Button variant={'primary'} className={styles.createButton}>
        Create Rollup Chain
      </Button>
    </div>
  )
}

export default App
