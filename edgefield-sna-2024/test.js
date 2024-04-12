$("#mybutton").on("click", async function () {
  console.log("clicked button");
  const response = await window.versions.ping();
  console.log(response);
});
