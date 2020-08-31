export const DEFAULT_ALERT_TIMEOUT = 30 * 1000
export const WALLET_IDX = 0
export const DEV_DOC_URL =
  'https://developer.offchainlabs.com/docs/Chain_parameters/'
// seems like metamask switched rinkeby and kovan chain ids?
export const ROLLUP_FACTORIES: { [chainId: number]: string | undefined } = {
  3: '0xb391A11CAeE4FACD5d99335b3bc9daD237cb855e', // ropsten
  4: '0x356e19929FCb4973c131d558300E3E353cb8e1C9', // rinkeby
  42: '0x8C1CD5861A26187e9373e7d9dbE90713baBE0260' // kovan
}
export const ARBOS_HASH = '0xb630f156cd873d438d8ac276eb00ba2408f5ee75bc36270577ae41314f19dfe3'