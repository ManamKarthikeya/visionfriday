async function test() {
  const apiKey = "AIzaSyCiew-mP_dRYqSAz_eDGIUmuh2psmi-Xbo";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  if (data.models) {
    const imageModels = data.models.filter(m => JSON.stringify(m).toLowerCase().includes("image") || JSON.stringify(m).toLowerCase().includes("banana"));
    console.log(imageModels.map(m => m.name));
  } else {
    console.log(data);
  }
}
test();
