import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Shellform Extension Activated");

    const formatter = vscode.languages.registerDocumentFormattingEditProvider(
        { language: "shellscript" },
        {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                console.log("Shellform Formatter Invoked");
                console.log(document.getText());

                return [];
            },
        },
    );

    context.subscriptions.push(formatter);
}

export function deactivate(): void {}
