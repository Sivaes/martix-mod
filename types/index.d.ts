declare module 'claude-code' {
  interface PluginState {
    matrix: { isOn: boolean; tick: number }
  }
}
export type MatrixState = { isOn: boolean; tick: number }
