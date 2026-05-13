async function test() {
  const response = await fetch("https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-3-medium", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text_prompts: [{ text: "A futuristic city", weight: 1 }],
      seed: 42,
      steps: 30
    })
  });
  console.log(response.status);
}
test();
