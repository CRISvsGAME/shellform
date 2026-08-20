# Changelog

## 0.2.0 - 2026-08-20

### Changed

- Corrected the publisher identifier casing to match the Visual Studio Marketplace publisher ID: `crisvsgame`.
- Promoted Shellform from pre-release/Preview to a regular Marketplace release.
- Added this changelog.

## 0.1.0 - 2026-08-19

### Added

- Initial Alpha release.
- Whole-document shell formatting using an externally installed `shfmt`.
- Formatting of the current in-memory editor buffer, including unsaved and untitled documents.
- Shell Script language-mode formatter registration.
- VS Code indentation integration using `insertSpaces` and `tabSize`.
- Tab and space indentation support.
- Protection against stale document results.
- Handling for formatter process and stream failures.
- No-op handling when formatter output is unchanged.
- VS Code integration test suite covering spaces, tabs, unchanged input, and invalid shell syntax.
- Workspace extension support for local and remote extension hosts.
