const express = require("express");
const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
    maxRedirects: 5,
    headers: headers
});

// Tambah header ini
res.setHeader("Content-Type", "video/mp4");
res.setHeader("Accept-Ranges", "bytes");
res.setHeader("Cache-Control", "no-cache");

if (response.headers["content-length"]) {
    res.setHeader("Content-Length", response.headers["content-length"]);
}

if (response.headers["content-range"]) {
    res.setHeader("Content-Range", response.headers["content-range"]);
    res.status(206); // Partial content
} else {
    res.status(200);
}

response.data.pipe(res);

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
        const headers = {
            "User-Agent": "AVDML_2.1.242.52-net4_ANDROID,unknown,MDLTaskPreload",
            "Icy-MetaData": "1",
            "Connection": "keep-alive"
        };

        // Forward Range header kalau ada
        if (req.headers.range) {
            headers["Range"] = req.headers.range;
        }

        const response = await axios({
            method: "GET",
            url: url,
            responseType: "stream",
            headers: headers
        });

        // Forward status dan headers dari CDN
        res.status(response.status);
        res.setHeader("Content-Type", response.headers["content-type"] || "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");

        if (response.headers["content-range"]) {
            res.setHeader("Content-Range", response.headers["content-range"]);
        }
        if (response.headers["content-length"]) {
            res.setHeader("Content-Length", response.headers["content-length"]);
        }

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
