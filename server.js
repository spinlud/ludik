import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const port = process.env.PORT || 8080;
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "dist");

const app = express();

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.get("Origin") || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authentication, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name");
    res.setHeader("Access-Control-Allow-Credentials", true);

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    return next();
});

app.use(express.static(distDir));

// SPA fallback: any GET that matched no static file gets index.html
app.use((req, res, next) => {
    if (req.method !== "GET") {
        return next();
    }
    return res.sendFile("index.html", { root: distDir });
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}..`);
});
