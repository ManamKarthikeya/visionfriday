async function test() {
  const response = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-pro", {
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
      steps: 30
    })
  });
  console.log(response.status);
  const data = await response.json();
  if (data.artifacts) {
    console.log("Success: FLUX.1 Pro exists!");
  } else {
    console.log("Error:", data);
  }
}
test();
