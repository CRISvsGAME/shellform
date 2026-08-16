import { spawn } from "child_process";
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
                    const process = spawn("shfmt", ["-i", indent.toString()]);

                    let stdout = "";
                    let stderr = "";

                    process.stdout.setEncoding("utf8");
                    process.stderr.setEncoding("utf8");

                    process.stdout.on("data", (data: string) => {
                        stdout += data;
                    });

                    process.stderr.on("data", (data: string) => {
                        stderr += data;
                    });

                    process.on("error", (error) => {
                        console.error(error);
                        resolve([]);
                    });

                    process.on("close", (code: number) => {
                        if (code !== 0) {
                            console.error(stderr);
                            resolve([]);
                            return;
                        }

                        console.log(stdout);
                        resolve([]);
                    });

                    process.stdin.end(document.getText());
                });
            },
        },
    );

    context.subscriptions.push(formatter);
}

export function deactivate(): void {}
