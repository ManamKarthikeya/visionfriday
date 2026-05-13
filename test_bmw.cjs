async function test() {
  const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: "A realistic photography of a BMW car",
      width: 1024,
      height: 1024,
      seed: 42,
      steps: 50
    })
  });
  console.log(response.status);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
