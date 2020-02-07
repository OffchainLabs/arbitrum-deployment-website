import React from 'react'
import { ArbFactoryFactory } from 'arb-provider-ethers/dist/lib/abi/ArbFactoryFactory'
import { ArbFactory } from 'arb-provider-ethers/dist/lib/abi/ArbFactory'
import { useDropzone } from 'react-dropzone'
import styles from './App.module.scss'
import {
  Alert,
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
import { getContractHash } from './util/file'

const ROLLUP_FACTORY = '0xd309F6Ba1B53CbDF9c0690eD1316A347eBb7adf9'
const WALLET_IDX = 0
const ALERT_TIMEOUT = 3 * 1000

interface RollupChainConfig {
  gracePeriod: string
  arbGasSpeed: string
  maxSteps: string
  maxTimeWidth: string
  stakeRequirement: string
  vmHash: string
}

const configInit: RollupChainConfig = {
  gracePeriod: '',
  arbGasSpeed: '',
  maxSteps: '',
  maxTimeWidth: '',
  stakeRequirement: '',
  vmHash: ''
}

const configLocal: RollupChainConfig = {
  gracePeriod: '450',
  arbGasSpeed: '20000000',
  maxSteps: '1000000000',
  maxTimeWidth: '20',
  stakeRequirement: '1',
  vmHash: ''
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
  value?: string
}> = ({ children, onChange, value, type = 'text' }) => (
  <InputGroup>
    <InputGroup.Prepend className={styles.formLabel}>
      <InputGroup.Text className={styles.formLabelText}>
        {children}
      </InputGroup.Text>
    </InputGroup.Prepend>
    <Form.Control onChange={onChange} value={value} />
  </InputGroup>
)

const App = () => {
  const [web3, setWeb3] = React.useState<ethers.providers.JsonRpcProvider>()
  const [factory, setFactory] = React.useState<ArbFactory>()
  const [config, setConfig] = React.useState<RollupChainConfig>(configInit)
  const [[alertVariant, alertContent, alertActive], setAlert] = React.useState<
    ['danger', string, boolean]
  >(['danger', '', false])
  const [fileName, setFileName] = React.useState<string>()
  const { getRootProps, getInputProps } = useDropzone({
    accept: '.ao',
    onDropAccepted: async (files, _e) => {
      const vmHash = await getContractHash(files)
      setConfig(c => ({ ...c, vmHash }))
      setFileName(files[0].name)
    }
  })

  React.useEffect(() => {
    if (!web3) {
      if (!web3Injected(window.ethereum)) {
        displayError('web3 not present') // TODO
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

  const closeAlert = () => setAlert(a => [a[0], a[1], false])

  const displayError = (message: string) => {
    setAlert(['danger', message, true])
    setTimeout(closeAlert, ALERT_TIMEOUT)
  }

  const updateConfig = (c: RollupChainConfig) =>
    setConfig(oldConfig => ({ ...c, vmHash: oldConfig.vmHash }))

  const handleCreateRollup = async () => {
    if (!web3 || !factory) {
      return displayError('missing web3 or factory')
    }

    // TODO better form validation
    const {
      gracePeriod,
      arbGasSpeed,
      maxSteps,
      maxTimeWidth,
      stakeRequirement,
      vmHash
    } = config
    if (
      !gracePeriod ||
      !arbGasSpeed ||
      !maxSteps ||
      !maxTimeWidth ||
      !stakeRequirement ||
      !vmHash
    ) {
      return displayError('missing parameter')
    }

    const addresses = await web3.listAccounts()

    factory.createRollup(
      vmHash,
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
          <Card.Body>
            {fileName ??
              'Drag and drop a contract file, or click to open a prompt.'}
          </Card.Body>
        </Card>
      </div>

      <div>
        <div className={mergeStyles(styles.baseTitle, styles.subtitle)}>
          Chain Configuration
        </div>

        <div className={styles.presetsContainer}>
          <span>Presets</span>
          <ButtonGroup>
            <Button
              {...groupButtonStyle}
              onClick={() => updateConfig(configInit)}
            >
              Blank
            </Button>
            <Button
              {...groupButtonStyle}
              onClick={() => updateConfig(configLocal)}
            >
              Local testing
            </Button>
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
              value={config.vmHash.slice(0, 20)}
            />
          </InputGroup>

          <FormattedFormInput
            children={'Stake requirement (ETH)'}
            onChange={e => {
              const stakeRequirement = e.target.value
              setConfig(c => ({ ...c, stakeRequirement }))
            }}
            value={config.stakeRequirement}
          />
          <FormattedFormInput
            children={'Grace period (seconds)'}
            onChange={e => {
              const gracePeriod = e.target.value
              setConfig(c => ({ ...c, gracePeriod }))
            }}
            value={config.gracePeriod}
          />
          <FormattedFormInput
            children={'Arb gas speed'}
            onChange={e => {
              const arbGasSpeed = e.target.value
              setConfig(c => ({ ...c, arbGasSpeed }))
            }}
            value={config.arbGasSpeed}
          />
          <FormattedFormInput
            children={'Max Steps'}
            onChange={e => {
              const maxSteps = e.target.value
              setConfig(c => ({ ...c, maxSteps }))
            }}
            value={config.maxSteps}
          />
          <FormattedFormInput
            children={'Max time bounds width (blocks)'}
            onChange={e => {
              const maxTimeWidth = e.target.value
              setConfig(c => ({ ...c, maxTimeWidth }))
            }}
            value={config.maxTimeWidth}
          />
        </div>
      </div>

      <Button
        variant={'primary'}
        className={styles.createButton}
        onClick={handleCreateRollup}
        size={'lg'}
        block
      >
        Create Rollup Chain
      </Button>
      {alertActive ? (
        <Alert
          variant={alertVariant}
          children={alertContent}
          className={styles.alert}
        />
      ) : null}
    </div>
  )
}

export default App
