import * as vscode from "vscode";
import { ShellformFormatProvider } from "./format-provider";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Shellform Extension Activated");

    const formatProvider = vscode.languages.registerDocumentFormattingEditProvider(
        { language: "shellscript" },
        new ShellformFormatProvider(),
    );

    context.subscriptions.push(formatProvider);
}

export function deactivate(): void {}
