import { BigNumber, bigNumberify } from 'ethers/utils'

// TODO shared lib

export const TICKS_PER_BLOCK = bigNumberify(1000)
export const SECONDS_PER_BLOCK = 13

export function blocksToTicks(block: number | BigNumber): BigNumber {
  return TICKS_PER_BLOCK.mul(block)
}

export function ticksToBlocks(ticks: BigNumber): BigNumber {
  return ticks.div(TICKS_PER_BLOCK)
}

export function ticksToSeconds(ticks: BigNumber): BigNumber {
  return ticksToBlocks(ticks).mul(SECONDS_PER_BLOCK)
}

export function secondsToTicks(seconds: number): BigNumber {
  return blocksToTicks(bigNumberify(seconds).div(SECONDS_PER_BLOCK))
}
