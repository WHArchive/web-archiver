const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cors = require("cors");

const fs = require("fs");
const scrape = require("website-scraper");

require("dotenv").config();

app.use(cors({ origin: "*" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

if(!fs.existsSync(`${__dirname}/archives`)) fs.mkdirSync(`${__dirname}/archives`);
if(!fs.existsSync(`${__dirname}/archives/data`)) fs.mkdirSync(`${__dirname}/archives/data`);

app.use("/", express.static(__dirname + "/public"));
app.use("/archive", express.static(__dirname + "/archives"));

app.post("/api/archive", async (req, res) => {
    if(!req.headers.password) return res.status(401).json({ "message": "No password provided.", "code": "NO_PASSWORD" });
    if(req.headers.password !== process.env.password) return res.status(401).json({ "message": "The password provided was incorrect.", "code": "INCORRECT_PASSWORD" });

    if(!req.body.url) return res.status(400).json({ "message": "No URL was provided.", "code": "NO_URL" });

    const uuid = require("crypto").randomUUID();

    const options = {
        urls: [`${req.body.url}`],
        directory: `archives/${uuid}`
    }

    try {
        await scrape(options);

        fs.writeFile(`archives/data/${uuid}.json`, `{"timestamp":"${Date.now()}","uuid":"${uuid}","website":"${req.body.url}"}`, function (err) {
            if(err) console.log(err);
        })

        res.status(200).json({
            "message": "The website has been archived.",
            "code": "WEBSITE_ARCHIVED",
            "website": `${req.body.url}`,
            "uuid": `${uuid}`,
            "url": `https://web.wharchive.org/archive/${uuid}`
        })
    } catch(err) {
        res.status(500).json({ "message": "A server error occurred.", "code": "SERVER_ERROR" });
    }
})

// Start
app.listen(process.env.port, () => console.log(`[SERVER] Listening on Port: ${process.env.port}`));