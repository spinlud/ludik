/**
 * ---------------------------------------------------------------------------------------------------------------------
 * server.js
 * ---------------------------------------------------------------------------------------------------------------------
 */

const
    express = require("express"),
    redirectToHTTPS = require("express-http-to-https").redirectToHTTPS,
    path = require("path"),
    bodyParser = require("body-parser"),
    cookiePraser = require("cookie-parser"),
    morgan = require("morgan"),
    httpStatusCodes = require("http-status-codes"),
    config = require("config"),
    http = require("http")
;

const port = process.env.PORT || config.get("port");
const platform = process.platform;
const distDir = config.get("dist_dir");

let app = express(),
    server = require("http").Server(app);

// Don't redirect if the hostname is `localhost:port`, `0.0.0.0:port` or the route is `/insecure`
app.use(redirectToHTTPS([/localhost:(\d{4})/, /0.0.0.0:(\d{4})/], [/\/insecure/], 301));

app.use(function (req, res, next) {

    res.setHeader("Access-Control-Allow-Origin", req.get("Origin") || "*");

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authentication, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5,  Date, X-Api-Version, X-File-Name");

    res.setHeader("Access-Control-Allow-Credentials", true);

    if (req.method === "OPTIONS") {
        return res.sendStatus(httpStatusCodes.OK);
    } else {
        return next();
    }
});

// app.use(morgan("dev")); // log every request to the console
app.use(bodyParser.json({limit: "50mb"}));
// app.use(cookiePraser());
app.use(express.static(path.resolve(__dirname, distDir)));

app.get("*", function(req, res) {
    res.sendFile("index.html", {
        root: distDir
    });
});

function startServer() {
    server.listen(port, function() {
        console.log("Server listening on port " + port + "..");
    });
}

function pingServer() {

    const timeout = 25 * 60 * 1000 // 25 minutes

    setInterval(function() {

        const options = {
            host: config.get("url_prod"),
            port: 8080,
            path: "/"
        };

        http.get(options, function(res) {
            res.on("data", function(chunk) {
                try {
                    // optional loggin
                } catch (err) {
                    console.log(err.message);
                }
            });
        }).on("error", function(err) {
            console.log("Error: " + err.message);
        });
    }, timeout);
}

startServer();

pingServer();












