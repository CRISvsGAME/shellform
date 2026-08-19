import * as assert from "node:assert/strict";
import * as vscode from "vscode";

suite("Shellform", () => {
    test("formats an untitled shell document using spaces", async () => {
        const extension = vscode.extensions.getExtension("crisvsgame.shellform");

        assert.ok(extension);

        await extension.activate();

        const input = "if true; then\necho hello\nfi\n";
        const expected = "if true; then\n    echo hello\nfi\n";

        const document = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: input,
        });

        const edits = await vscode.commands.executeCommand<vscode.TextEdit[] | undefined>(
            "vscode.executeFormatDocumentProvider",
            document.uri,
            {
                insertSpaces: true,
                tabSize: 4,
            },
        );

        assert.ok(edits);

        const workspaceEdit = new vscode.WorkspaceEdit();

        workspaceEdit.set(document.uri, edits);

        const applied = await vscode.workspace.applyEdit(workspaceEdit);

        assert.equal(applied, true);
        assert.equal(document.getText(), expected);
    });

    test("formats an untitled shell document using tabs", async () => {
        const extension = vscode.extensions.getExtension("crisvsgame.shellform");

        assert.ok(extension);

        await extension.activate();

        const input = "if true; then\necho hello\nfi\n";
        const expected = "if true; then\n\techo hello\nfi\n";

        const document = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: input,
        });

        const edits = await vscode.commands.executeCommand<vscode.TextEdit[] | undefined>(
            "vscode.executeFormatDocumentProvider",
            document.uri,
            {
                insertSpaces: false,
                tabSize: 8,
            },
        );

        assert.ok(edits);

        const workspaceEdit = new vscode.WorkspaceEdit();

        workspaceEdit.set(document.uri, edits);

        const applied = await vscode.workspace.applyEdit(workspaceEdit);

        assert.equal(applied, true);
        assert.equal(document.getText(), expected);
    });

    test("returns no edits for already formatted input", async () => {
        const extension = vscode.extensions.getExtension("crisvsgame.shellform");

        assert.ok(extension);

        await extension.activate();

        const input = "if true; then\n    echo hello\nfi\n";

        const document = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: input,
        });

        const edits = await vscode.commands.executeCommand<vscode.TextEdit[] | undefined>(
            "vscode.executeFormatDocumentProvider",
            document.uri,
            {
                insertSpaces: true,
                tabSize: 4,
            },
        );

        assert.equal(edits, undefined);
        assert.equal(document.getText(), input);
    });

    test("returns no edits for invalid shell syntax", async () => {
        const extension = vscode.extensions.getExtension("crisvsgame.shellform");

        assert.ok(extension);

        await extension.activate();

        const input = "if true; then\n    echo hello\n";

        const document = await vscode.workspace.openTextDocument({
            language: "shellscript",
            content: input,
        });

        const edits = await vscode.commands.executeCommand<vscode.TextEdit[] | undefined>(
            "vscode.executeFormatDocumentProvider",
            document.uri,
            {
                insertSpaces: true,
                tabSize: 4,
            },
        );

        assert.equal(edits, undefined);
        assert.equal(document.getText(), input);
    });
});
