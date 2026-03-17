# Action Setup

## Goal
Connect the Custom GPT to the local MCP server so it can read project prompts and upload generated images.

## Steps
1. Start the MCP server on `http://localhost:3000`.
2. Open the Custom GPT builder.
3. Enable `Image Generation`.
4. Start a public HTTPS tunnel that points to the MCP server. For this MVP the current Quick Tunnel URL is `https://cooking-horses-optimal-journalism.trycloudflare.com`.
5. Add an action using the OpenAPI file at `mcp/openapi/custom-gpt-action.yaml`.
6. Confirm the OpenAPI `servers.url` points to `https://cooking-horses-optimal-journalism.trycloudflare.com`.
7. Ensure the following operations are available:
   - `list_active_projects`
   - `get_project_execution_context`
   - `upload_generated_image`
8. Save the GPT.

## Notes
- The OpenAPI schema supports `openaiFileIdRefs` and a `fileBase64` fallback for local testing.
- For remote deployment, update the server URL and the `servers` section of the OpenAPI file.
