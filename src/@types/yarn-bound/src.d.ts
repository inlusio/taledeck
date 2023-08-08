declare module 'yarn-bound/src' {
  import bondage, { CommandResult, OptionsResult, Runner, TextResult } from '@mnbroatch/bondage/src/index.js'
  import { Result } from '@mnbroatch/bondage/src/results.js'

  export interface YarnBoundOptions {
    dialogue: string
    variableStorage?: unknown
    functions?: Record<string, (...args: Array<unknown>) => unknown>
    handleCommand?: (...args: Array<unknown>) => unknown
    combineTextAndOptionsResults?: boolean
    locale?: string
    pauseCommand?: string
    startAt?: string
  }

  class YarnBound {
    readonly handleCommand: (...args: Array<unknown>) => unknown
    readonly pauseCommand: string
    readonly combineTextAndOptionsResults: boolean
    readonly bondage: bondage
    readonly bufferedNode: unknown
    readonly currentResult: unknown
    readonly history: Array<unknown>
    readonly locale: string
    readonly runner: Runner

    constructor(options: YarnBoundOptions)

    jump(startAt: unknown): void

    advance(optionIndex?: number): void

    registerFunction(name: string, func: () => void): void
  }

  export { CommandResult, OptionsResult, Result, TextResult }

  export default YarnBound
}
