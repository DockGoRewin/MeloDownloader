const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
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

app.get("/api/convert", async (req, res) => {
    const { url } = req.query;

    if (!url || !url.includes("melolostatic.com")) {
        return res.status(400).json({
            success: false,
            message: "URL tidak valid"
        });
    }

    const tmpInput = `/tmp/input_${Date.now()}.mp4`;
    const tmpOutput = `/tmp/output_${Date.now()}.mp4`;

    try {
        // Download dulu ke server
        const response = await axios({
            method: "GET",
            url: url,
            responseType: "stream",
            headers: {
                "User-Agent": "AVDML_2.1.242.52-net4_ANDROID,unknown,MDLTaskPreload"
            }
        });

        const writer = fs.createWriteStream(tmpInput);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on("finish", resolve);
            writer.on("error", reject);
        });

        // Convert H.265 ke H.264
        await new Promise((resolve, reject) => {
            const ffmpeg = spawn("ffmpeg", [
                "-i", tmpInput,
                "-vcodec", "libx264",
                "-preset", "ultrafast",
                "-crf", "28",
                "-acodec", "aac",
                tmpOutput
            ]);

            ffmpeg.on("close", (code) => {
                if (code === 0) resolve();
                else reject(new Error(`ffmpeg exit ${code}`));
            });

            ffmpeg.on("error", reject);
        });

        // Kirim file hasil convert
        res.setHeader("Content-Type", "video/mp4");
        const stat = fs.statSync(tmpOutput);
        res.setHeader("Content-Length", stat.size);

        const stream = fs.createReadStream(tmpOutput);
        stream.pipe(res);

        stream.on("close", () => {
            fs.unlinkSync(tmpInput);
            fs.unlinkSync(tmpOutput);
        });

    } catch (err) {
        if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput);
        if (fs.existsSync(tmpOutput)) fs.unlinkSync(tmpOutput);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running di port ${PORT}`);
});
