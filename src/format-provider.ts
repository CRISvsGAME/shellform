import * as vscode from "vscode";
import { ShellformFormatRequest } from "./format-request";

export class ShellformFormatProvider implements vscode.DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken,
    ): Promise<vscode.TextEdit[]> {
        const formatrequest = new ShellformFormatRequest();

        return formatrequest.run(document, options, token);
    }
}
