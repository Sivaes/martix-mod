declare module 'claude-code' {
  interface PluginState {
    matrix: {
      isOn: boolean
      tick: number
      words: Shaped<string[]>
      log: Shaped<LogEntry[]>
      draft: string
      isBusy: boolean
    }
  }
}
export type LogEntry = { who: 'you' | 'claude'; text: string }
export type MatrixState = { isOn: boolean; tick: number; words: string[]; log: LogEntry[]; draft: string; isBusy: boolean }
