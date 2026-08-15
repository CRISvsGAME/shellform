import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Shellform Extension Activated");

    const formatter = vscode.languages.registerDocumentFormattingEditProvider(
        { language: "shellscript" },
        {
            provideDocumentFormattingEdits(
                document: vscode.TextDocument,
                options: vscode.FormattingOptions,
            ): vscode.TextEdit[] {
                console.log("Shellform Formatter Invoked");
                console.log(document.getText());
                console.log({ insertSpaces: options.insertSpaces, tabSize: options.tabSize });

                return [];
            },
        },
    );

    context.subscriptions.push(formatter);
}

export function deactivate(): void {}
