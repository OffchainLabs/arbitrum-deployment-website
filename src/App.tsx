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
  Form,
  FormControl,
  InputGroup
} from 'react-bootstrap'
import { ethers } from 'ethers'
import { web3Injected, getInjectedWeb3 } from './util/web3'

const ROLLUP_FACTORY = '0xd309F6Ba1B53CbDF9c0690eD1316A347eBb7adf9'
const WALLET_IDX = 0

interface RollupChainConfig {
  gracePeriod: string
  arbGasSpeed: string
  maxSteps: string
  maxTimeWidth: string
  stakeRequirement: string
}

const configLocal: RollupChainConfig = {
  gracePeriod: '450',
  arbGasSpeed: '20000000',
  maxSteps: '1000000000',
  maxTimeWidth: '20',
  stakeRequirement: '1'
}

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

declare global {
  interface EventTarget {
    value: any
  }
}

const FormattedFormInput: React.FC<{
  type?: string
  onChange: React.FormEventHandler<HTMLInputElement>
}> = ({ children, onChange, type = 'text' }) => (
  <InputGroup>
    <InputGroup.Prepend className={styles.formLabel}>
      <InputGroup.Text className={styles.formLabelText}>
        {children}
      </InputGroup.Text>
    </InputGroup.Prepend>
    <Form.Control onChange={onChange} />
  </InputGroup>
)

const App = () => {
  const { getRootProps, getInputProps } = useDropzone({ accept: '.ao' })
  const [web3, setWeb3] = React.useState<ethers.providers.JsonRpcProvider>()
  const [factory, setFactory] = React.useState<ArbFactory>()
  const [config, setConfig] = React.useState<Partial<RollupChainConfig>>({})
  console.log(config)

  React.useEffect(() => {
    if (!web3) {
      if (!web3Injected(window.ethereum)) {
        alert('web3 not present') // TODO
      } else {
        getInjectedWeb3().then(provider => {
          setWeb3(provider)
          setFactory(
            ArbFactoryFactory.connect(
              ROLLUP_FACTORY,
              provider.getSigner(WALLET_IDX)
            )
          )
        })
      }
    }
  })

  const handleCreateRollup = async () => {
    if (!web3 || !factory) {
      throw new Error('missing web3 or factory')
    }

    // TODO better form validation
    const {
      gracePeriod,
      arbGasSpeed,
      maxSteps,
      maxTimeWidth,
      stakeRequirement
    } = config
    if (
      !gracePeriod ||
      !arbGasSpeed ||
      !maxSteps ||
      !maxTimeWidth ||
      !stakeRequirement
    ) {
      throw new Error('missing required rollup parameter ' + JSON.stringify(config))
    }

    const addresses = await web3.listAccounts()

    factory.createRollup(
      ethers.constants.HashZero,
      ethers.utils.bigNumberify(gracePeriod),
      ethers.utils.bigNumberify(arbGasSpeed),
      ethers.utils.bigNumberify(maxSteps),
      ethers.utils.bigNumberify(maxTimeWidth),
      ethers.utils.bigNumberify(stakeRequirement),
      addresses[WALLET_IDX]
    )
  }

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

      <div>
        <div className={mergeStyles(styles.baseTitle, styles.subtitle)}>
          Chain Configuration
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
            <InputGroup.Prepend className={styles.formLabel}>
              <InputGroup.Text className={styles.formLabelText}>
                Machine Hash
              </InputGroup.Text>
            </InputGroup.Prepend>
            <FormControl
              className={styles.machineHash}
              type={'text'}
              readOnly
              plaintext
              value={'TODO'}
            />
          </InputGroup>

          <FormattedFormInput
            children={'Stake requirement (ETH)'}
            onChange={e => {
              const stakeRequirement = e.target.value
              setConfig(c => ({ ...c, stakeRequirement }))
            }}
          />
          <FormattedFormInput
            children={'Grace period (seconds)'}
            onChange={e => {
              const gracePeriod = e.target.value
              setConfig(c => ({ ...c, gracePeriod }))
            }}
          />
          <FormattedFormInput
            children={'Arb gas speed'}
            onChange={e => {
              const arbGasSpeed = e.target.value
              setConfig(c => ({ ...c, arbGasSpeed }))
            }}
          />
          <FormattedFormInput
            children={'Max Steps'}
            onChange={e => {
              const maxSteps = e.target.value
              setConfig(c => ({ ...c, maxSteps }))
            }}
          />
          <FormattedFormInput
            children={'Max time bounds width (blocks)'}
            onChange={e => {
              const maxTimeWidth = e.target.value
              setConfig(c => ({ ...c, maxTimeWidth }))
            }}
          />
        </div>
      </div>

      <Button
        variant={'primary'}
        className={styles.createButton}
        onClick={handleCreateRollup}
      >
        Create Rollup Chain
      </Button>
    </div>
  )
}

export default App
