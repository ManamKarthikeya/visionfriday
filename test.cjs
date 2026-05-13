async function test() {
  const response = await fetch("https://integrate.api.nvidia.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Authorization": "Bearer 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",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "black-forest-labs/flux1-dev",
      prompt: "A futuristic city",
      response_format: "b64_json"
    })
  });
  console.log(response.status);
  console.log(await response.text());
}
test();
