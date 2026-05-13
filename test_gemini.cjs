async function test() {
  const apiKey = "AIzaSyCiew-mP_dRYqSAz_eDGIUmuh2psmi-Xbo";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: "A futuristic city" }]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    })
  });
  console.log(response.status);
  const data = await response.json();
  if (data.candidates && data.candidates[0].content.parts) {
     const parts = data.candidates[0].content.parts;
     const imagePart = parts.find(p => p.inlineData);
     if (imagePart) {
         console.log("Image received! length:", imagePart.inlineData.data.length);
     } else {
         console.log("No inlineData found", JSON.stringify(parts).substring(0, 200));
     }
  } else {
     console.log("Error:", JSON.stringify(data));
  }
}
test();
