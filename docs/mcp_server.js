import express from "express";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res) => {
  const body = req.body;

  // 간단한 mock 응답
  return res.json({
    content: [{ type: "text", text: "MCP 서버 정상 동작" }]
  });
});

app.listen(3000, () => {
  console.log("MCP server running on http://localhost:3000/mcp");
});
