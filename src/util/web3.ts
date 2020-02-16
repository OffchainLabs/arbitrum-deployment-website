import * as ethers from 'ethers'

interface MetamaskEventListeners {
  accountsChanged: (accounts: string[]) => void
  chainChanged: (chainIdHex: string) => void
  networkChanged: (chainId: string) => void
}

// it would be nice to use the isMetamask property to determine whether these
// properties are present
export interface InjectedEthereumProvider
  extends ethers.ethers.providers.AsyncSendable {
  enable?: () => Promise<string[]>
  autoRefreshOnNetworkChange?: boolean
  on?<T extends keyof MetamaskEventListeners>(
    event: T,
    listener: MetamaskEventListeners[T]
  ): void
}

declare global {
  interface Window {
    ethereum?: InjectedEthereumProvider
  }
}

export function web3Injected(
  e: InjectedEthereumProvider | undefined
): e is InjectedEthereumProvider {
  return e !== undefined
}

export async function getInjectedWeb3(): Promise<
  ethers.providers.Web3Provider
> {
  if (web3Injected(window.ethereum)) {
    window.ethereum.autoRefreshOnNetworkChange = false

    try {
      ;(await window.ethereum.enable?.()) ??
        console.warn('No window.ethereum.enable function')
    } catch (e) {
      throw new Error('Failed to enable window.ethereum: ' + e.message)
    }

    return new ethers.providers.Web3Provider(window.ethereum)
  }

  throw new Error('No web3 injection detected')
}
