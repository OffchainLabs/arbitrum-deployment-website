export const DEFAULT_ALERT_TIMEOUT = 30 * 1000
export const WALLET_IDX = 0
export const DEV_DOC_URL =
  'https://developer.offchainlabs.com/docs/Chain_parameters/'
// seems like metamask switched rinkeby and kovan chain ids?
export const ROLLUP_FACTORIES: { [chainId: number]: string | undefined } = {
  // 3: '0xb391A11CAeE4FACD5d99335b3bc9daD237cb855e', // ropsten
  // 4: '0x356e19929FCb4973c131d558300E3E353cb8e1C9', // rinkeby
  42: '0xee1250962014364aCf506061E66e78e65b8bCEEC' // kovan
}
export const ARBOS_HASH = '0x5bec2cc2daea1334022bfb3ec9da5912aafc7adf06ab29a3ba583ad6565d2c8e'