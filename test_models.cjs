async function test() {
  const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
    headers: {
      "Authorization": "Bearer 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"
    }
  });
  const data = await response.json();
  if (data && data.data) {
    const fluxModels = data.data.filter(m => m.id.toLowerCase().includes("flux"));
    console.log(fluxModels);
  } else {
    console.log(data);
  }
}
test();
