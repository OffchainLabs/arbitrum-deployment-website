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
import {
  web3Injected,
  getInjectedWeb3,
  InjectedEthereumProvider
} from './util/web3'
import Logo from './logo.png'
import { abi } from 'arb-provider-ethers'
import { ArbConversion } from 'arb-provider-ethers/dist/lib/conversion';
import * as chainConfig from './config/chain'
import { 
  ARBOS_HASH,
  ROLLUP_FACTORIES,
  DEFAULT_ALERT_TIMEOUT,
  WALLET_IDX,
  DEV_DOC_URL
} from './config/constants'

type WithGeneric = Parameters<NonNullable<React.ComponentProps<typeof Form.Control>['onChange']>>[0];
type ExtractGeneric<Type> = Type extends React.ChangeEvent<infer X> ? X : never;

// FormControlElement, ready for you to export.
type FormControlElement = ExtractGeneric<WithGeneric>;

const arbConversion = new ArbConversion()


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
  rollupAddress: string
}

const FormattedFormInput: React.FC<{
  type?: string
  onChange: React.FormEventHandler<FormControlElement>
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
  const [web3, setWeb3] = React.useState<ethers.providers.Web3Provider>()
  const [[factory, factoryNet], setFactory] = React.useState<
    [abi.ArbFactory, number] | []
  >([])
  const [config, setConfig] = React.useState(chainConfig.init)
  const [[alertVariant, alertContent, alertActive], setAlert] = React.useState<
    ['danger' | 'success', string, boolean]
  >(['danger', '', false])
  const [fileName, setFileName] = React.useState<string>()
  const [rollupAddr, setRollupAddr] = React.useState<string>()
  const closeAlert = React.useCallback(
    () => setAlert(a => [a[0], a[1], false]),
    [setAlert]
  )

  const displayError = React.useCallback(
    (message: string) => {
      setAlert(['danger', message, true])
      setTimeout(closeAlert, DEFAULT_ALERT_TIMEOUT)
    },
    [setAlert, closeAlert]
  )

  const displayInfo = React.useCallback(
    (message: string) => {
      setAlert(['success', message, true])
      setTimeout(closeAlert, DEFAULT_ALERT_TIMEOUT)
    },
    [setAlert, closeAlert]
  )

  const updateFactory = React.useCallback(
    (chainId: number, signer: ethers.Signer) => {

      const factoryAddr = ROLLUP_FACTORIES[chainId]
      if (!factoryAddr) {
        return displayError(
          'We do not have a deployed Rollup factory for the current Web3 provider: ' +
            chainId
        )
      }
      // TODO when anon callers are wrapped in useCallback, this can be
      // gated by alertActive
      closeAlert()

      setFactory([
        abi.ArbFactoryFactory.connect(factoryAddr, signer),
        chainId
      ])
    },
    [setFactory, displayError, closeAlert]
  )

  React.useEffect(() => {
    if (!web3) {
      console.log('!web3')
      if (!web3Injected(window.ethereum)) {
        return displayError(
          'Web3 not injected; do you have MetaMask installed?'
        )
      }

      // TODO try to clean this up by wrapping the metamask listeners in
      // useCallback. this should enable use to use the updateFactory callback
      // properly with the `web3` state property being updated. nested callbacks
      // lead to weirdness with web3 not being present and double registers.
      let w3: ethers.providers.Web3Provider
      getInjectedWeb3().then(provider => {
        w3 = provider
        setWeb3(provider)
        return provider.getNetwork()
      })
      .then(network => {
        const mm: InjectedEthereumProvider = w3._web3Provider
        if (mm.on && typeof mm.on === 'function') {
          // this 
          mm.on('chainChanged', hexNetworkId => updateFactory(parseInt(hexNetworkId, 16), w3.getSigner(WALLET_IDX)))
          mm.on('networkChanged', networkId => updateFactory(parseInt(networkId, 10), w3.getSigner(WALLET_IDX)))
          mm.on('accountsChanged', _a => {
            if (factoryNet) {
              updateFactory(factoryNet, w3.getSigner(WALLET_IDX))
            } else {
              console.warn(
                'accountsChanged event received but no factory present'
              )
            }
          })
        } else {
          console.warn(
            "No 'on' function detected, not setting Metamask event listeners"
          )
        }
        updateFactory(network.chainId, w3.getSigner(WALLET_IDX))
      })
    }

    // if (web3 && !factory) {}
  }, [web3, displayError, setWeb3, factory, updateFactory, factoryNet])

  const updateConfig = (c: chainConfig.RollupParams) =>
    setConfig(oldConfig => ({ ...c }))

  const handleCopyAddr = () => {
    if (!rollupAddr) {
      return displayError('No rollup address to copy')
    }

    navigator.clipboard
      .writeText(rollupAddr)
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

    let parsedStakeRequirement
    try {
      parsedStakeRequirement = ethers.utils.parseEther(config.stakeRequirement)
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
          ARBOS_HASH,
          arbConversion.secondsToTicks(parsedGracePeriod * 60),
          arbConversion.secondsToTicks(speedLimitSeconds),
          ethers.utils.bigNumberify(maxSteps),
          parsedStakeRequirement,
          '0x0000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000',
          '0x'
        )
      ).wait()

      const e = result.events?.find((e: ethers.Event) =>
        e.topics.includes((factory.interface.events.RollupCreated as ethers.utils.EventDescription).topic)
      )

      // thanks for the 'array' ethers
      const {
        rollupAddress
      }: RollupCreatedParams = (e?.args as any) as RollupCreatedParams

      setRollupAddr(rollupAddress)
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
        </div>
      </div>

      <Button
        variant={rollupAddr ? 'success' : 'primary'}
        className={styles.createButton}
        onClick={rollupAddr ? handleCopyAddr : handleCreateRollup}
        size={'lg'}
        block
        disabled={
          !(factory && factoryNet && ROLLUP_FACTORIES[factoryNet]) ? true : false
        }
      >
        {rollupAddr ? `${rollupAddr} (click to copy)` : 'Create Rollup Chain'}
      </Button>
    </div>
  )
}

export default App
