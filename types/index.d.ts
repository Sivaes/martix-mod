declare module 'claude-code' {
  interface PluginState {
    matrix: { isOn: boolean; tick: number; words: Shaped<string[]> }
  }
}
export type MatrixState = { isOn: boolean; tick: number; words: string[] }
