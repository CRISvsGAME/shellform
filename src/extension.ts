import { spawn } from "node:child_process";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Shellform Extension Activated");

    const formatter = vscode.languages.registerDocumentFormattingEditProvider(
        { language: "shellscript" },
        {
            provideDocumentFormattingEdits(
                document: vscode.TextDocument,
                options: vscode.FormattingOptions,
            ): Promise<vscode.TextEdit[]> {
                const indent = options.insertSpaces ? options.tabSize : 0;

                return new Promise((resolve) => {
                    const version = document.version;
                    const input = document.getText();
                    const process = spawn("shfmt", ["-i", indent.toString()]);

                    let stdout = "";
                    let stderr = "";
                    let settled = false;

                    const finish = (edits: vscode.TextEdit[]): void => {
                        if (settled) {
                            return;
                        }

                        settled = true;
                        stdout = "";
                        stderr = "";
                        resolve(edits);
                    };

                    const fail = (error: unknown): void => {
                        if (settled) {
                            return;
                        }

                        console.error(error);
                        finish([]);
                    };

                    process.stdout.setEncoding("utf8");
                    process.stderr.setEncoding("utf8");

                    process.stdout.on("data", (data: string) => {
                        if (!settled) {
                            stdout += data;
                        }
                    });

                    process.stderr.on("data", (data: string) => {
                        if (!settled) {
                            stderr += data;
                        }
                    });

                    process.stdin.on("error", fail);
                    process.stdout.on("error", fail);
                    process.stderr.on("error", fail);
                    process.on("error", fail);

                    process.on("close", (code) => {
                        if (settled) {
                            return;
                        }

                        if (code !== 0) {
                            fail(stderr);
                            return;
                        }

                        if (version !== document.version) {
                            finish([]);
                            return;
                        }

                        if (input === stdout) {
                            finish([]);
                            return;
                        }

                        const range = new vscode.Range(document.positionAt(0), document.positionAt(input.length));

                        finish([vscode.TextEdit.replace(range, stdout)]);
                    });

                    process.stdin.end(input);
                });
            },
        },
    );

    context.subscriptions.push(formatter);
}

export function deactivate(): void {}
