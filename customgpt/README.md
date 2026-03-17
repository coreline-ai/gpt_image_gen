# Custom GPT MVP Guide

This folder contains the operator-facing artifacts needed to configure the Custom GPT for the image-project MVP.

## Included files
- `instructions.md`: final assistant instructions
- `action-setup.md`: how to connect the MCP OpenAPI document
- `test-scenarios.md`: manual verification checklist
- `examples/`: copy/paste snippets for builder setup

## MVP operating rule
- Custom GPT must read project prompts from MCP before generating images.
- Custom GPT must generate images directly in ChatGPT.
- After image generation completes, Custom GPT must immediately call `upload_generated_image`.
- Batch flows must process the first item, upload it, and ask before continuing.
