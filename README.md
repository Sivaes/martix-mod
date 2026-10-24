# Matrix mod for Claude

Gives Claude a Matrix look. It adds a side panel of falling green "digital rain" code, a green status band above the message box with a blinking cursor, and a short terminal-style voice for Claude's replies. Type `/matrix` to switch all of it off or back on.

Colors come from the Claude Matrix design system: phosphor green `#00ff41` on pure black.

## Install

At the prompt of a terminal session:

```
/plugin install matrix --marketplace Sivaes/matrix-mod
```

Answer `y` to add the marketplace, then pick a scope.

From a shell:

```
claude plugin install matrix --marketplace Sivaes/matrix-mod
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `Sivaes/matrix-mod`, then Add plugin.

## Notes

- The mod draws its own panel and band; it does not recolor the app itself. Pair it with dark mode, or a green-on-black terminal theme in Claude Code.
- The status band greets "Jaq". Edit `hooks/register.tsx` to change it.
