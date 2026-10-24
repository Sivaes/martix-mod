import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

// Claude Matrix design-system colors (Terminal theme)
const C = {
  void: '#000000',
  head: '#c8ffd4', // ink
  phosphor: '#00ff41',
  deep: '#008f11',
  dim: '#14512a', // line
  muted: '#5fbf74', // ink-muted
}

const PANE = 'matrix-rain'
const isOn = atom({ plugin: 'matrix', key: 'isOn' } as const, true)
const tick = atom({ plugin: 'matrix', key: 'tick' } as const, 0)

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789Z:.=*+-<>'
const TRAIL = 12

const hash = (a: number, b: number, c = 0): number => {
  let x = (a * 374761393 + b * 668265263 + c * 2147483647) | 0
  x = Math.imul(x ^ (x >>> 13), 1274126177)
  return (x ^ (x >>> 16)) >>> 0
}

const VOICE = [
  'Matrix theme is on. Talk like a calm operator at a green-on-black terminal:',
  'short, direct sentences; status-style lines are fine (e.g. "> done.", "> 3 files changed.");',
  'an occasional light Matrix nod is OK (at most one per reply, never forced).',
  'Never let the style reduce clarity, accuracy or completeness, and drop it entirely for',
  'serious or sensitive topics.',
].join(' ')

let timer: Timer | undefined

function startRain($: EngineInterface): void {
  if (timer) return
  timer = $.clock.every(150, () => {
    void update($, tick, n => (n + 1) % 1_000_000)
  })
}

function stopRain(): void {
  timer?.cancel()
  timer = undefined
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'matrix',
      description: 'Toggle the Claude Matrix theme (rain pane, band, terminal voice)',
    })
    if (await read($, isOn)) {
      void $.ui.open({ id: PANE, title: 'Matrix' })
      startRain($)
    }
    return next(e)
  })

  on('command.run', { command: 'matrix' }, async $ => {
    const now = !(await read($, isOn))
    await update($, isOn, () => now)
    if (now) {
      const opened = await $.ui.open({ id: PANE, title: 'Matrix' })
      startRain($)
      if (!opened.isPlaced) {
        return {
          text:
            '> matrix: online (voice only). This app has no room for mod panels, so the rain and band stay hidden here. Open Claude Code in a terminal to see them.',
        }
      }
      return { text: '> matrix: online. wake up, Jaq.' }
    }
    stopRain()
    await $.ui.close({ id: PANE })
    return { text: '> matrix: offline.' }
  })

  on('prompt.compose', async ($, e, next) => {
    const result = await next(e)
    if (!(await read($, isOn))) return result
    return {
      sections: [...result.sections, { id: 'matrix:voice', text: VOICE, scope: 'session' }],
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || !(await read($, isOn))) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const t = await read($, tick)
    const cursor = Math.floor(t / 4) % 2 === 0 ? '█' : ' '
    return (
      <Box backgroundColor={C.void} paddingX={1} borderStyle="single" borderColor={C.deep}>
        <Text color={C.phosphor} bold>
          {'> '}
        </Text>
        <Text color={C.muted}>connected // wake up, Jaq </Text>
        <Text color={C.phosphor}>{cursor}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const t = await read($, tick)
    const cols = Math.max(8, Math.min(60, Math.floor((e.viewport?.columns ?? 40) / 2)))
    const rows = Math.max(8, Math.min(40, (e.viewport?.rows ?? 24) - 4))

    const lines = []
    for (let r = 0; r < rows; r++) {
      const segs: { color: string; text: string }[] = []
      for (let c = 0; c < cols; c++) {
        const speed = 1 + (hash(c, 1) % 3)
        const span = rows + TRAIL + (hash(c, 2) % rows)
        const head = (Math.floor(t * speed / 2) + (hash(c, 3) % span)) % span
        const d = head - r
        let color = C.void
        let ch = ' '
        if (d >= 0 && d < TRAIL) {
          color = d === 0 ? C.head : d < 3 ? C.phosphor : d < 7 ? C.deep : C.dim
          ch = GLYPHS[hash(c, r, Math.floor(t / (d === 0 ? 1 : 4))) % GLYPHS.length] ?? '0'
        }
        const cell = ch + ' '
        const last = segs[segs.length - 1]
        if (last && last.color === color) last.text += cell
        else segs.push({ color, text: cell })
      }
      lines.push(
        <Box key={`r${r}`} flexDirection="row">
          {segs.map((s, i) => (
            <Text key={`s${i}`} color={s.color} wrap="truncate">
              {s.text}
            </Text>
          ))}
        </Box>,
      )
    }

    return (
      <Box flexDirection="column" backgroundColor={C.void} padding={1}>
        {lines}
      </Box>
    )
  })

  // ── Transcript skin: Claude's replies, your messages, command rows, spinner ──
  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    if (e.props.isSummary || !(await read($, isOn))) return next(e)
    const { Box, Text, Markdown } = $.ui.resolve(e)
    return (
      <Box flexDirection="column" backgroundColor={C.void} borderStyle="single" borderColor={C.deep} paddingX={1}>
        {e.props.isFirstOfReply && (
          <Text color={C.phosphor} bold>
            {'> claude://'}
          </Text>
        )}
        <Markdown text={e.props.text} />
      </Box>
    )
  })

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (!['composer', 'bridge', 'sdk'].includes(e.props.origin.kind) || !(await read($, isOn))) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box backgroundColor={C.void} borderStyle="single" borderColor={C.dim} paddingX={1}>
        <Text color={C.phosphor} bold>
          {'jaq@zion:~$ '}
        </Text>
        <Text color={C.head}>{e.props.text}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'CommandOutput' }, async ($, e, next) => {
    if (!(await read($, isOn))) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box backgroundColor={C.void} paddingX={1}>
        <Text color={e.props.isErrored ? '#ff5c5c' : C.phosphor}>{e.props.text}</Text>
      </Box>
    )
  })

  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    if (!(await read($, isOn)) || e.props.message !== null) return next(e)
    return next({ ...e, props: { ...e.props, word: 'Decoding the Matrix' } })
  })

}
