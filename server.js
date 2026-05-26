const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("API hidup");
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API works"
  })
})

app.get("/api/download", async (req, res) => {
    const { url } = req.query;

    if (!url || !url.includes("melolostatic.com")) {
        return res.status(400).json({
            success: false,
            message: "URL tidak valid"
        });
    }

    res.redirect(url);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});
