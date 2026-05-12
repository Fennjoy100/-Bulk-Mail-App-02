const app = require("./app");
const { connectToDatabase } = require("./lib/db");

const port = Number(process.env.PORT || 4000);

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Bulk mail API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start local server", error);
    process.exit(1);
  });
