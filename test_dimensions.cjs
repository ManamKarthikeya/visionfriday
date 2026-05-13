async function test() {
  const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "A beautiful cinematic landscape at sunset",
      width: 1376, // 16:9 test
      height: 768,
      seed: 42,
      steps: 4
    })
  });
  console.log(response.status);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
