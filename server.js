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

    try {
        const response = await axios({
            method: "GET",
            url: url,
            responseType: "stream",
            headers: {
                "User-Agent": "AVDML_2.1.242.52-net4_ANDROID,unknown,MDLTaskPreload",
                "Icy-MetaData": "1",
                "Connection": "keep-alive"
            }
        });

        res.setHeader("Content-Type", "video/mp4");
        response.data.pipe(res);

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Gagal fetch video",
            error: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running");
});
