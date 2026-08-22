import * as vscode from "vscode";
import { ShellformFormatProvider } from "./format-provider";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Shellform Extension Activated");

    const formatter = vscode.languages.registerDocumentFormattingEditProvider(
        { language: "shellscript" },
        new ShellformFormatProvider(),
    );

    context.subscriptions.push(formatter);
}

export function deactivate(): void {}
