# Shellform

## Shell Script Formatter for Visual Studio Code

![Shellform](images/icon.png)

Shellform is a lightweight Visual Studio Code extension for formatting shell
scripts using [shfmt](https://github.com/mvdan/sh).

**0.2.0** is the first regular release. It provides whole-document formatting
through VS Code, using the current editor buffer and the document's indentation
options. Behaviour may change as the extension develops.

---

## 📦 Installation

Requirements:

- Visual Studio Code **1.101.0 or later**.
- An externally installed `shfmt` executable available on the extension host's
  `PATH`. Shellform does not bundle or download it.

Install `shfmt` using the instructions in the
[shfmt project](https://github.com/mvdan/sh#shfmt), then verify your installation:

```bash
shfmt --version
```

Install Shellform from the
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=crisvsgame.shellform).

For WSL, Remote SSH, or development containers, install both Shellform and
`shfmt` in the remote environment where the workspace extension host runs.

---

## 🚀 Quick Start

1. Open a shell script, or create an untitled document.
2. Set its language mode to **Shell Script** if it is not already selected.
3. Run **Format Document With...** and select **Shellform**.

For example, with four-space indentation:

```sh
if true; then
echo hello
fi
```

Becomes:

```sh
if true; then
    echo hello
fi
```

To use Shellform as the default shell formatter and format on save, add this
to your VS Code settings:

```json
{
    "[shellscript]": {
        "editor.defaultFormatter": "crisvsgame.shellform",
        "editor.formatOnSave": true
    }
}
```

---

## 🔧 Features

- Whole-document formatting through VS Code's formatting provider.
- Current in-memory input, including unsaved changes and untitled documents.
- Eligibility based on Shell Script language mode, with no filename-extension requirement.
- Tabs or spaces and indentation width taken from VS Code's formatting options.
- No edits for unchanged formatter output.
- No edits after process or stream failure, unsuccessful exit, or a document-version change.
- Formatted edits applied by VS Code; Shellform does not write the source file directly.
- Script contents passed to `shfmt` as data, never executed.
- No runtime npm dependencies.

---

## 🎛️ Formatting Behaviour

Configure indentation through VS Code:

```json
{
    "[shellscript]": {
        "editor.insertSpaces": true,
        "editor.tabSize": 4
    }
}
```

Shellform passes the buffer to `shfmt` through stdin and reads the formatted
result from stdout. It supplies `-i` for indentation and otherwise uses the
installed formatter's defaults. There are no Shellform-specific settings or
free-form argument options in this release.

---

## 🚧 Current Limitations

- Whole-document formatting only; selection/range formatting is not implemented.
- Shellform does not yet select or enforce a shell dialect; `shfmt`'s automatic
  dialect detection and fallback behaviour apply.
- Shellform does not provide EditorConfig integration. Its explicit indentation
  flag disables `shfmt`'s EditorConfig formatting options.
- Cancellation, timeouts, request supersession, and active-process cleanup on
  extension deactivation are not yet implemented. A stalled formatter can leave
  a request pending.
- Failures are logged to the extension host console; there are no user-facing
  error notifications or executable-path settings yet.
- Development has been exercised in WSL Ubuntu. The four integration tests pass
  in Linux extension hosts for VS Code 1.101.0 and 1.136.1 with `shfmt` 3.12.0.
  Windows, macOS, and other remote environments have not been validated.

---

## 📂 Project Structure

```text
src/
    extension.ts
    test/
        extension.test.ts
images/
    icon.png
    icon.svg
.vscode/
    launch.json
    tasks.json
.vscode-test.mjs
.gitignore
LICENSE
CHANGELOG.md
README.md
package-lock.json
package.json
tsconfig.json
out/ # generated JavaScript and source maps
```

---

## 🧪 Testing

Install development dependencies and run the integration tests:

```bash
npm ci
npm test
```

The test command compiles the extension and runs tests in a downloaded VS Code
Extension Development Host. It requires `shfmt` on `PATH` and a graphical
environment capable of running VS Code.

The current configuration targets stable VS Code. The four tests cover spaces,
tabs, unchanged input, and invalid shell syntax through VS Code's formatting API.

After building, run against the minimum supported VS Code version:

```bash
npm exec -- vscode-test --code-version 1.101.0
```

---

## 🛠️ Build

Build the extension:

```bash
npm run build
```

Watch for source changes:

```bash
npm run dev
```

Open the repository in VS Code and press **F5** to launch the configured
Extension Development Host.

---

## 📝 License

[MIT License](LICENSE)

---

## 🔗 Links

- Marketplace: https://marketplace.visualstudio.com/items?itemName=crisvsgame.shellform
- Source Code: https://github.com/CRISvsGAME/shellform
- Issues: https://github.com/CRISvsGAME/shellform/issues
- shfmt: https://github.com/mvdan/sh
