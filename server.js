const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API hidup");
});

app.post("/api/download", (req, res) => {

    const { url } = req.body;

    res.json({
        success: true,
        url
    });
});


app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API works"
  })
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});
