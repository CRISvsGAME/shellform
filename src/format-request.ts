import { spawn } from "node:child_process";
import * as vscode from "vscode";

export class ShellformFormatRequest {
    constructor(
        private readonly document: vscode.TextDocument,
        private readonly options: vscode.FormattingOptions,
        private readonly token: vscode.CancellationToken,
    ) {}

    run(): Promise<vscode.TextEdit[]> {
        if (this.token.isCancellationRequested) {
            return Promise.resolve([]);
        }

        const indent = this.options.insertSpaces ? this.options.tabSize : 0;

        return new Promise((resolve) => {
            const version = this.document.version;
            const input = this.document.getText();
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

                if (this.token.isCancellationRequested) {
                    cancel();
                    return;
                }

                if (code !== 0) {
                    fail(stderr);
                    return;
                }

                if (version !== this.document.version) {
                    finish([]);
                    return;
                }

                if (input === stdout) {
                    finish([]);
                    return;
                }

                const range = new vscode.Range(this.document.positionAt(0), this.document.positionAt(input.length));

                finish([vscode.TextEdit.replace(range, stdout)]);
            });

            cancellation = this.token.onCancellationRequested(cancel);

            if (this.token.isCancellationRequested) {
                cancel();
            } else {
                process.stdin.end(input);
            }
        });
    }
}
