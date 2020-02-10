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
import { secondsToTicks } from './util/ticks'

const ROLLUP_FACTORY = '0xd309F6Ba1B53CbDF9c0690eD1316A347eBb7adf9'
const WALLET_IDX = 0
const ALERT_TIMEOUT = 3 * 1000
const GAS_PER_SECOND = 10 ** 8
const GAS_PER_STEP = 5 // average

const cpuFactorToSpeedLimit = (factor: number): number =>
  factor * GAS_PER_SECOND
const assertionTimeToSteps = (seconds: number, speedLimitSeconds: number) =>
  (seconds * speedLimitSeconds) / GAS_PER_STEP

interface RollupChainConfig {
  gracePeriod: string // minutes
  speedLimitFactor: string // cpu factor
  maxAssertionTime: string // seconds
  maxTimeWidth: string // blocks
  stakeRequirement: string // eth
  vmHash: string
}

const configInit: RollupChainConfig = {
  gracePeriod: '',
  speedLimitFactor: '',
  maxAssertionTime: '',
  maxTimeWidth: '',
  stakeRequirement: '',
  vmHash: ''
}

const configLocal: RollupChainConfig = {
  gracePeriod: '10',
  speedLimitFactor: '0.2',
  maxAssertionTime: '250',
  maxTimeWidth: '20',
  stakeRequirement: '0.1',
  vmHash: ''
}

const configTestnet: RollupChainConfig = {
  gracePeriod: '180',
  speedLimitFactor: '1.0',
  maxAssertionTime: '50',
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
      speedLimitFactor,
      maxAssertionTime,
      maxTimeWidth,
      stakeRequirement,
      vmHash
    } = config
    if (
      !gracePeriod ||
      !speedLimitFactor ||
      !maxAssertionTime ||
      !maxTimeWidth ||
      !stakeRequirement ||
      !vmHash
    ) {
      return displayError('missing parameter')
    }

    const addresses = await web3.listAccounts()

    const speedLimitSeconds = cpuFactorToSpeedLimit(
      parseFloat(speedLimitFactor)
    )
    const speedLimitTicks = secondsToTicks(speedLimitSeconds)
    const maxSteps = assertionTimeToSteps(
      parseInt(maxAssertionTime, 10),
      speedLimitSeconds
    )
    const gracePeriodTicks = secondsToTicks(parseInt(gracePeriod, 10) * 60)

    factory.createRollup(
      vmHash,
      gracePeriodTicks,
      speedLimitTicks,
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
              children={'Blank'}
            />
            <Button
              {...groupButtonStyle}
              onClick={() => updateConfig(configLocal)}
              children={'Local'}
            />
            <Button
              {...groupButtonStyle}
              onClick={() => updateConfig(configTestnet)}
              children={'Testnet'}
            />
          </ButtonGroup>
        </div>

        <div className={styles.chainParamsForm}>
          <InputGroup>
            <InputGroup.Prepend className={styles.formLabel}>
              <InputGroup.Text
                className={styles.formLabelText}
                children={'Initial VM Hash'}
              />
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
            children={'Grace period (minutes)'}
            onChange={e => {
              const gracePeriod = e.target.value
              setConfig(c => ({ ...c, gracePeriod }))
            }}
            value={config.gracePeriod}
          />
          <FormattedFormInput
            children={'Speed limit'}
            onChange={e => {
              const speedLimitFactor = e.target.value
              setConfig(c => ({ ...c, speedLimitFactor }))
            }}
            value={config.speedLimitFactor}
          />
          {/* TODO note how this is converted */}
          <FormattedFormInput
            children={'Max assertion size (seconds)'}
            onChange={e => {
              const maxAssertionTime = e.target.value
              setConfig(c => ({ ...c, maxAssertionTime }))
            }}
            value={config.maxAssertionTime}
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
