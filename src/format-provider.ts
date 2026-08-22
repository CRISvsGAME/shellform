import { spawn } from "node:child_process";
import * as vscode from "vscode";

export class ShellformFormatProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken,
    ): Promise<vscode.TextEdit[]> {
        if (token.isCancellationRequested) {
            return Promise.resolve([]);
        }

        const indent = options.insertSpaces ? options.tabSize : 0;

        return new Promise((resolve) => {
            const version = document.version;
            const input = document.getText();
            const process = spawn("shfmt", ["-i", indent.toString()]);

            let stdout = "";
            let stderr = "";
            let settled = false;
            let cancellation: vscode.Disposable | undefined;

            const finish = (edits: vscode.TextEdit[]): void => {
                if (settled) {
                    return;
                }

                settled = true;
                cancellation?.dispose();
                stdout = "";
                stderr = "";
                resolve(edits);
            };

            const cleanup = (): void => {
                process.stdin.destroy();

                if (process.pid !== undefined && process.exitCode === null && process.signalCode === null) {
                    process.kill("SIGTERM");
                }
            };

            const fail = (error: unknown): void => {
                if (settled) {
                    return;
                }

                console.error(error);
                finish([]);
                cleanup();
            };

            const cancel = (): void => {
                if (settled) {
                    return;
                }

                finish([]);
                cleanup();
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

                if (token.isCancellationRequested) {
                    cancel();
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

            cancellation = token.onCancellationRequested(cancel);

            if (token.isCancellationRequested) {
                cancel();
            } else {
                process.stdin.end(input);
            }
        });
    }
}
