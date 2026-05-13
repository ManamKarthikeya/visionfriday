async function test() {
  const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "A futuristic city",
      width: 1024,
      height: 1024,
      seed: 42,
      steps: 25
    })
  });
  console.log(response.status);
  const text = await response.text();
  console.log(text.substring(0, 500));
}
test();
