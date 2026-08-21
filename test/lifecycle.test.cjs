const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { PassThrough } = require("node:stream");
const { test } = require("node:test");
const { runInNewContext } = require("node:vm");

const filename = join(__dirname, "../out/extension.js");
const source = readFileSync(filename, "utf8");

function startRequest(t) {
    const child = new EventEmitter();
    const signals = [];

    child.pid = 123;
    child.exitCode = null;
    child.signalCode = null;

    child.kill = (signal) => {
        signals.push(signal);
        return true;
    };

    child.on("close", (exit, signal) => {
        child.exitCode = exit;
        child.signalCode = signal ?? null;
    });

    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();

    t.after(() => {
        child.stdin.destroy();
        child.stdout.destroy();
        child.stderr.destroy();
    });

    let shellform;

    const edits = [];
    const errors = [];

    const fakeTextEdit = {
        replace(range, newText) {
            const edit = { range, newText };

            edits.push(edit);

            return edit;
        },
    };

    class FakeRange {
        constructor(start, end) {
            this.start = start;
            this.end = end;
        }
    }

    function registerDocumentFormattingEditProvider(selector, provider) {
        assert.equal(selector.language, "shellscript");

        shellform = provider;

        return { dispose() {} };
    }

    const fakeLanguages = {
        registerDocumentFormattingEditProvider,
    };

    const vscode = {
        languages: fakeLanguages,
        Range: FakeRange,
        TextEdit: fakeTextEdit,
    };

    const exports = {};

    function fakeRequire(name) {
        if (name === "vscode") {
            return vscode;
        }

        if (name === "node:child_process") {
            return { spawn: () => child };
        }

        throw new Error(`Unexpected Module: ${name}`);
    }

    const fakeConsole = {
        log() {},

        error(error) {
            errors.push(error);
        },
    };

    const context = {
        exports,
        require: fakeRequire,
        console: fakeConsole,
    };

    const options = { filename };

    runInNewContext(source, context, options);

    exports.activate({ subscriptions: [] });

    const document = {
        version: 1,
        getText: () => "input text",
        positionAt: (offset) => offset,
    };

    const result = shellform.provideDocumentFormattingEdits(document, {
        insertSpaces: true,
        tabSize: 4,
    });

    return { child, result, errors, edits, signals };
}

for (const origin of ["stdin", "stdout", "stderr", "process"]) {
    test(`${origin} failure settles before close and ignores later events`, { timeout: 1000 }, async (t) => {
        const { child, result, errors, edits, signals } = startRequest(t);
        const failure = new Error("first failure");

        child.stdout.write("partial output");

        (origin === "process" ? child : child[origin]).emit("error", failure);

        const textEdits = await result;

        assert.equal(textEdits.length, 0);
        assert.equal(child.stdin.destroyed, true);
        assert.deepEqual(signals, ["SIGTERM"]);

        child.stdout.write("late output");
        child.stderr.write("late error");

        for (const emitter of [child.stdin, child.stdout, child.stderr, child]) {
            emitter.emit("error", new Error("late failure"));
        }

        child.emit("close", 0);

        assert.equal(textEdits.length, 0);
        assert.deepEqual(errors, [failure]);
        assert.equal(edits.length, 0);
        assert.deepEqual(signals, ["SIGTERM"]);
    });
}

test("successful close combines utf-8 chunks and ignores later events", { timeout: 1000 }, async (t) => {
    const { child, result, errors, edits, signals } = startRequest(t);
    const expected = "drink café";
    const bytes = Buffer.from(expected);
    const split = bytes.indexOf(0xc3) + 1;

    child.stdout.write(bytes.subarray(0, split));
    child.stdout.write(bytes.subarray(split));

    child.emit("close", 0);

    child.stdout.write("late output");
    child.stderr.write("late error");

    for (const emitter of [child.stdin, child.stdout, child.stderr, child]) {
        emitter.emit("error", new Error("late failure"));
    }

    const textEdits = await result;

    assert.equal(textEdits.length, 1);
    assert.equal(textEdits[0].newText, expected);
    assert.equal(errors.length, 0);
    assert.equal(edits.length, 1);
    assert.equal(edits[0].newText, expected);
    assert.deepEqual(signals, []);
});

for (const code of [1, null]) {
    test(`exit code ${code} rejects partial output and logs the error`, { timeout: 1000 }, async (t) => {
        const { child, result, errors, edits, signals } = startRequest(t);
        const errorText = "formatter failed";

        child.stdout.write("partial output");
        child.stderr.write(errorText);

        child.emit("close", code, code === null ? "SIGTERM" : null);

        const textEdits = await result;

        assert.equal(textEdits.length, 0);
        assert.deepEqual(errors, [errorText]);
        assert.equal(edits.length, 0);
        assert.deepEqual(signals, []);
    });
}

test("spawn failure closes stdin without attempting termination", { timeout: 1000 }, async (t) => {
    const { child, result, signals } = startRequest(t);

    child.pid = undefined;

    child.emit("error", new Error("spawn failed"));

    const textEdits = await result;

    assert.equal(textEdits.length, 0);
    assert.equal(child.stdin.destroyed, true);
    assert.deepEqual(signals, []);
});

for (const status of [
    { exitCode: 0, signalCode: null },
    { exitCode: null, signalCode: "SIGTERM" },
]) {
    test(`stream failure after ${JSON.stringify(status)} does not terminate again`, { timeout: 1000 }, async (t) => {
        const { child, result, signals } = startRequest(t);

        child.exitCode = status.exitCode;
        child.signalCode = status.signalCode;

        child.stdout.emit("error", new Error("read failed after exit"));

        const textEdits = await result;

        assert.equal(textEdits.length, 0);
        assert.equal(child.stdin.destroyed, true);
        assert.deepEqual(signals, []);
    });
}

test("termination error cannot re-enter cleanup or make output eligible", { timeout: 1000 }, async (t) => {
    const { child, result, errors, edits } = startRequest(t);
    const failure = new Error("write failed");

    let attempts = 0;

    child.kill = () => {
        attempts += 1;
        child.emit("error", new Error("termination failed"));
        return false;
    };

    child.stdin.emit("error", failure);
    child.stdout.write("late output");

    child.emit("close", 0);

    const textEdits = await result;

    assert.equal(textEdits.length, 0);
    assert.equal(attempts, 1);
    assert.deepEqual(errors, [failure]);
    assert.equal(edits.length, 0);
});
