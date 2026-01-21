# Semantic Versioning (SemVer)

A versioning scheme that uses a 3-part number format: MAJOR.MINOR.PATCH. 

- **MAJOR** incompatible API changes.
- **MINOR** added functionality in a backwards-compatible manner.
- **PATCH** made backwards-compatible bug fixes or improvements.

## Principles

- Read commit history to determine the type of changes made.
- Should follow [Conventional Commits](./conventional-commits.md) format.
- Increment version numbers based on the nature of changes:
  - Increment MAJOR version for breaking changes `<type>!:`.
  - Increment MINOR version for new features `feat:`.
  - Increment PATCH version for bug fixes `fix:`.