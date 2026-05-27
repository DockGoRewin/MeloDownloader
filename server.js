const express = require("express");
const axios = require("axios");
const { spawn } = require("child_process");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API hidup");
});

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "API works"
    });
});

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
    "User-Agent": "ttplayer(version:2.10.242.150-newcv,appId:-1,os:Android,traceId:1779842037992T23232,appSessionId:LTE3MjU4NDE3MjUxNzc5ODQxOTcyMTA2,tag:ShortPlay),AVDML_2.1.242.52-net4_ANDROID,ShortPlay,MDLTaskPlay",
    "Accept": "*/*",
    "Connection": "keep-alive",
    "Icy-MetaData": "1",
    "Engine-ID": "9321678",
    "X-Tt-Fapi": "1",
    "X-Tt-SubTag": "SeriesPage",
    "X-Tt-Tag": "ShortPlay",
    "X-ReqType": "play"
};

        if (req.headers.range) {
            headers["Range"] = req.headers.range;
        }

        const response = await axios({
            method: "GET",
            url: url,
            responseType: "stream",
            maxRedirects: 5,
            headers: headers
        });

        res.setHeader("Content-Type", "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "no-cache");

        if (response.headers["content-length"]) {
            res.setHeader("Content-Length", response.headers["content-length"]);
        }

        if (response.headers["content-range"]) {
            res.setHeader("Content-Range", response.headers["content-range"]);
            res.status(206);
        } else {
            res.status(200);
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

app.get("/api/stream", async (req, res) => {
    const { url } = req.query;

    if (!url || !url.includes("melolostatic.com")) {
        return res.status(400).json({
            success: false,
            message: "URL tidak valid"
        });
    }

    res.setHeader("Content-Type", "video/mp4");
    res.setHeader("Accept-Ranges", "none");

    const ffmpeg = spawn("ffmpeg", [
        "-i", url,
        "-vcodec", "libx264",
        "-preset", "ultrafast",
        "-crf", "28",
        "-acodec", "aac",
        "-f", "mp4",
        "-movflags", "frag_keyframe+empty_moov",
        "pipe:1"
    ]);

    ffmpeg.stdout.pipe(res);

    ffmpeg.stderr.on("data", (data) => {
        console.error(data.toString());
    });

    ffmpeg.on("error", (err) => {
        console.error("ffmpeg error:", err.message);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: err.message });
        }
    });

    ffmpeg.on("close", (code) => {
        console.log(`ffmpeg exit: ${code}`);
    });

    req.on("close", () => {
        ffmpeg.kill();
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running di port ${PORT}`);
});
