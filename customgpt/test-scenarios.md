# Manual Test Scenarios

## Single item flow
- [ ] Ask the GPT to list available projects.
- [ ] Confirm that the project summary includes item count and progress.
- [ ] Ask the GPT to run the project.
- [ ] Confirm that the GPT shows the next item prompt before generation.
- [ ] Confirm that the GPT generates one image.
- [ ] Confirm in the action preview or logs that `openaiFileIdRefs` is included when `upload_generated_image` is called.
- [ ] Confirm that the GPT reports a successful upload with URL or path.
- [ ] Confirm that the same URL opens in the browser.

## Batch flow
- [ ] Ask the GPT to generate all remaining items.
- [ ] Confirm that only the first item is generated and uploaded.
- [ ] Confirm that the GPT asks whether to continue with the remaining items.

## Failure flow
- [ ] Stop the MCP server or send an invalid upload payload.
- [ ] Confirm that the GPT reports the upload failure without pretending success.
- [ ] Confirm that `No upload payload provided` is treated as a missing generated-file attachment problem.
- [ ] Confirm that the user is told to retry the same item.
