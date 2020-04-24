import React from 'react'
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
import Logo from './logo.png'
import * as chainConfig from './util/chainConfig'
import { abi } from 'arb-provider-ethers'
import { ArbConversion } from 'arb-provider-ethers/dist/lib/conversion';

const arbConversion = new ArbConversion()
const ROLLUP_FACTORY = '0x2ff2D1Cced0EBD48ca829d3C9E7f86A1141F761F'
const WALLET_IDX = 0
const ALERT_TIMEOUT = 30 * 1000
const DEV_DOC_URL = 'https://developer.offchainlabs.com/docs/Chain_parameters/'

const mergeStyles = (...styles: string[]): string => styles.join(' ')

const groupButtonStyle: ButtonProps = {
  variant: 'info'
}

declare global {
  interface EventTarget {
    value: any
  }
}

interface RollupCreatedParams {
  vmAddress: string
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
  const [factory, setFactory] = React.useState<abi.ArbFactory>()
  const [config, setConfig] = React.useState(chainConfig.init)
  const [[alertVariant, alertContent, alertActive], setAlert] = React.useState<
    ['danger' | 'success', string, boolean]
  >(['danger', '', false])
  const [fileName, setFileName] = React.useState<string>()
  const [rollupAddr, setRollupAddr] = React.useState<string>()
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
            abi.ArbFactoryFactory.connect(
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

  const displayInfo = (message: string) => {
    setAlert(['success', message, true])
    setTimeout(closeAlert, ALERT_TIMEOUT)
  }

  const updateConfig = (c: chainConfig.RollupParams) =>
    setConfig(oldConfig => ({ ...c, vmHash: oldConfig.vmHash }))

  const handleCopyAddr = () => {
    if (!rollupAddr) {
      return displayError('No rollup address to copy')
    }

    navigator.clipboard.writeText(rollupAddr)
      .then(() => displayInfo('Contract address copied!'))
      .catch(() => displayError('Unable to copy address!'))
  }

  const handleCreateRollup = async () => {
    if (!web3 || !factory) {
      return displayError(`Missing: Web3 ${!!web3} Factory ${!!factory}`)
    }

    // TODO better form validation & feedback via Formik
    const missing = []
    for (const prop in config) {
      if (!config[prop as keyof chainConfig.RollupParams]) {
        missing.push(prop)
      }
    }

    if (missing.length > 0) {
      return displayError('Misisng required properties: ' + missing)
    }

    const parsedGracePeriod = parseInt(config.gracePeriod, 10)
    const parsedSpeedLimitFactor = parseFloat(config.speedLimitFactor)
    const parsedMaxAssertionSize = parseInt(config.maxAssertionSize, 10)
    if (
      isNaN(parsedGracePeriod) ||
      isNaN(parsedSpeedLimitFactor) ||
      isNaN(parsedMaxAssertionSize)
    ) {
      return displayError('Non-number value passed in.')
    }

    let parsedStakeRequirement, parsedMaxTimeWidth
    try {
      parsedStakeRequirement = ethers.utils.parseEther(config.stakeRequirement)
      parsedMaxTimeWidth = ethers.utils.bigNumberify(config.maxTimeWidth)
    } catch (e) {
      console.error(e)
      return displayError(
        'Non-number value passed in. See console for more details.'
      )
    }

    if (parsedStakeRequirement < ethers.utils.parseUnits('1', 'gwei')) {
      return displayError('Stake requirement should be at least 1 gwei.')
    } else if (parsedGracePeriod < 2 || parsedGracePeriod > 60 * 24 * 7) {
      return displayError(
        'Grace period must be more than 2 mins and less than 1 week.'
      )
    } else if (parsedSpeedLimitFactor < 0.1 || parsedSpeedLimitFactor > 100) {
      return displayError('Invalid speed limit, must be in the range 0.1 - 100')
    } else if (
      arbConversion.secondsPerBlock.div(2).gt(parsedMaxAssertionSize) ||
      parsedMaxAssertionSize > (parsedGracePeriod * 60) / 4
    ) {
      return displayError(
        'Invalid max assertion size. Must be at least half of the average block time (13 seconds on a public network) and no more than 1/4 of the grace period.'
      )
    } else if (
      parsedMaxTimeWidth.lt(5) ||
      parsedMaxTimeWidth.gt(arbConversion.secondsToBlocks(parsedGracePeriod * 60))
    ) {
      return displayError(
        `Invalid max time width, should be in range 5 - (gracePeriod * 60 / ${arbConversion.secondsPerBlock})`
      )
    }

    const speedLimitSeconds = arbConversion.cpuFactorToSpeedLimitSecs(parsedSpeedLimitFactor)
    const maxSteps = arbConversion.assertionTimeToSteps(
      parsedMaxAssertionSize,
      speedLimitSeconds
    )

    displayInfo('Deploying contract...')

    try {
      const addresses = await web3.listAccounts()

      const result = await (
        await factory.createRollup(
          config.vmHash,
          arbConversion.secondsToTicks(parsedGracePeriod * 60),
          arbConversion.secondsToTicks(speedLimitSeconds),
          ethers.utils.bigNumberify(maxSteps),
          parsedMaxTimeWidth,
          parsedStakeRequirement,
          addresses[WALLET_IDX]
        )
      ).wait()

      const e = result.events?.find(e =>
        e.topics.includes(factory.interface.events.RollupCreated.topic)
      )

      // thanks for the 'array' ethers
      const {
        vmAddress
      }: RollupCreatedParams = (e?.args as any) as RollupCreatedParams

      setRollupAddr(vmAddress)
    } catch (e) {
      console.error(e)
      return displayError('Unable to deploy contract. See console for details.')
    }

    displayInfo('Contract deployed!')
  }

  return (
    <div className={styles.rootContainer}>
      <div className={styles.titleContainer}>
        <img src={Logo} alt={'Offchain Labs logo'} className={styles.logo} />
        <div className={mergeStyles(styles.baseTitle, styles.title)}>
          Arbitrum Rollup Chain Creator
        </div>
      </div>

      <div className={styles.uploadContainer}>
        <div className={mergeStyles(styles.baseTitle, styles.subtitle)}>
          Contract Upload
        </div>
        <Card className={styles.dndContainer} {...getRootProps()}>
          <input {...getInputProps()} />
          <Card.Body>
            {fileName ??
              'Drag and drop an Arbitrum executable, or click to open a prompt.'}
          </Card.Body>
        </Card>
      </div>

      <div>
        <div className={mergeStyles(styles.baseTitle, styles.subtitle)}>
          Chain Configuration
        </div>

        <div>
          For more information on what these parameters do,{' '}
          <a href={DEV_DOC_URL}>check out the developer documentation</a>.
        </div>

        <div className={styles.presetsContainer}>
          <span className={mergeStyles(styles.baseTitle, styles.presetTitle)}>
            Presets
          </span>
          <ButtonGroup>
            <Button
              {...groupButtonStyle}
              onClick={() => updateConfig(chainConfig.init)}
              children={'Blank'}
            />
            <Button
              {...groupButtonStyle}
              onClick={() => updateConfig(chainConfig.local)}
              children={'Local'}
            />
            <Button
              {...groupButtonStyle}
              onClick={() => updateConfig(chainConfig.testnet)}
              children={'Testnet'}
            />
          </ButtonGroup>
        </div>

        {alertActive ? (
          <Alert
            variant={alertVariant}
            children={alertContent}
            className={styles.alert}
          />
        ) : null}

        <div className={styles.chainParamsForm}>
          <InputGroup>
            <InputGroup.Prepend className={styles.formLabel}>
              <InputGroup.Text
                className={styles.formLabelText}
                children={'Initial Chain State Hash'}
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
          <FormattedFormInput
            children={'Max assertion size (seconds)'}
            onChange={e => {
              const maxAssertionSize = e.target.value
              setConfig(c => ({ ...c, maxAssertionSize }))
            }}
            value={config.maxAssertionSize}
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
        variant={rollupAddr ? 'success' : 'primary'}
        className={styles.createButton}
        onClick={rollupAddr ? handleCopyAddr : handleCreateRollup}
        size={'lg'}
        block
      >
        {rollupAddr ? `${rollupAddr} (click to copy)` : 'Create Rollup Chain'}
      </Button>
    </div>
  )
}

export default App
