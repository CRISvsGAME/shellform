import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Shellform Extension Activated");

    const formatter = vscode.languages.registerDocumentFormattingEditProvider(
        { language: "shellscript" },
        {
            provideDocumentFormattingEdits(): vscode.TextEdit[] {
                console.log("Shellform Formatter Invoked");

                return [];
            },
        },
    );

    context.subscriptions.push(formatter);
}

export function deactivate(): void {}
