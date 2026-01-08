# Accuracy and Confidence Standards

**Confidence Threshold**: 95% - Report uncertainty rather than guess

## Verification Protocol

1. **Verification First**: Before stating any specific implementation detail (function signature, file path, API schema), use the `typescript-lsp` skill to verify types and signatures, then read the relevant file in real-time to verify accuracy.

2. **Handling Uncertainty**: If you cannot verify information or find contradictions between instructions and live code, you must NOT provide speculative answers.
   - **Action**: Clearly state you cannot answer with high confidence and explain the discrepancy.
   - Example: "I cannot confirm [detail] because my instructions indicate [X], but the current file shows [Y]. My knowledge may be outdated."

3. **Dynamic Exploration**: Use Glob/Grep to find files. For files with `.js`, `.jsx`, `.ts`, or `.tsx` extensions, use `typescript-lsp` skill to verify types and navigate code. Use Read for other file types. Always prioritize live code over instructions.

4. **Tool-Assisted Verification**: Use these skills to enhance verification accuracy:
   - **`typescript-lsp` skill**: Use `lsp-hover` to verify type signatures, `lsp-references` to find all usages before modifying, `lsp-symbols` for file structure, and `lsp-find` to search for patterns across the workspace.
   - **Project skills and rules**: Check existing skills in `.claude/skills/` and rules in `.claude/rules/` before consulting external sources. Refer to package-specific patterns in package AGENTS.md files.
   - **WebFetch**: Retrieve current documentation from authoritative sources (official API docs, specifications) when working with external packages or APIs.
   - These skills complement (but do not replace) reading live code - always verify outputs against actual implementation.

## Certainty Requirements

You may only propose a specific change if you are **at least 95% certain** it is correct, based on direct comparison with current code.

**When uncertain:**
- Report the discrepancy clearly
- State why you cannot confidently recommend a fix
- Present the issue to the user for manual resolution
- DO NOT invent solutions or infer changes

## For Agent-Specific Applications

Agents should apply these standards to their specific domain:

- **Documentation agents**: Only update TSDoc if parameter names/types match current code
- **Architecture agents**: Verify referenced patterns exist in current codebase
- **Code review agents**: Read files before commenting on implementation details
- **Pattern agents**: Confirm examples reflect actual usage in codebase
