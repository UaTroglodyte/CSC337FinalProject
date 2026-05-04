const http = require("http");
const PORT = 8080;
const fs = require("fs");
const crypto = require("crypto");

const sessions = {};

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

function readUsers() {
    if (fs.existsSync("user_data.json")) {
        return JSON.parse(fs.readFileSync("user_data.json"));
    }
    return [];
}

function writeUsers(users) {
    fs.writeFileSync("user_data.json", JSON.stringify(users, null, 2));
}

function getLoggedInUser(req) {
    const cookie = req.headers.cookie;
    if (!cookie) {
        return null;
    }
    const cookies = cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const parts = cookies[i].trim().split("=");
        if (parts[0] === "sessionId") {
            const sessionId = parts[1];
            return sessions[sessionId];
        }
    }
    return null;
}

function giveDefaultSkins(user) {
    if (!user.ownedSkins) {
        user.ownedSkins = ["greenSnake"];
    }
    if (!user.selectedSkin) {
        user.selectedSkin = "greenSnake";
    }
}

const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
        const html = fs.readFileSync("login.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    } else if (req.method === "GET" && req.url === "/register") {
        const html = fs.readFileSync("register.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    } else if (req.method === "GET" && req.url === "/game") {
        const username = getLoggedInUser(req);
        if (!username) {
            res.writeHead(302, { "Location": "/" });
            res.end();
            return;
        }
        const html = fs.readFileSync("game.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    } else if (req.method === "GET" && req.url === "/shop") {
        const username = getLoggedInUser(req);
        if (!username) {
            res.writeHead(302, { "Location": "/" });
            res.end();
            return;
        }
        const html = fs.readFileSync("shop.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);
    } else if (req.method === "GET" && req.url === "/game.js") {
        const js = fs.readFileSync("game.js");
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(js);
    } else if (req.method === "GET" && req.url === "/shop.js") {
        const js = fs.readFileSync("shop.js");
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(js);
    } else if (req.method === "GET" && req.url === "/style.css") {
        const css = fs.readFileSync("style.css");
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(css);
    } else if (req.method === "POST" && req.url === "/submit") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const data = JSON.parse(body);
            const users = readUsers();
            const user = users.find(u => u.username === data.username);
            if (!user) {
                res.writeHead(401, { "Content-Type": "text/plain" });
                res.end("Incorrect Username or Password");
                return;
            }
            const hashedInput = hashPassword(data.password);
            if (user.password !== hashedInput) {
                res.writeHead(401, { "Content-Type": "text/plain" });
                res.end("Incorrect Username or Password");
                return;
            }
            const sessionId = crypto.randomBytes(16).toString("hex");
            sessions[sessionId] = user.username;
            res.writeHead(200, {
                "Content-Type": "text/plain",
                "Set-Cookie": `sessionId=${sessionId}; HttpOnly`
            });
            res.end("Login successful!");
        });
    } else if (req.method === "POST" && req.url === "/register") {
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const data = JSON.parse(body);
            const users = readUsers();
            const existingUser = users.find(u => u.username === data.username);
            if (existingUser) {
                res.writeHead(409, { "Content-Type": "text/plain" });
                res.end("Username already exists");
                return;
            }
            const newUser = {
                username: data.username,
                password: hashPassword(data.password),
                highScore: 0,
                totalScore: 0,
                ownedSkins: ["greenSnake"],
                selectedSkin: "greenSnake"
            };
            users.push(newUser);
            writeUsers(users);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Registration successful!");
        });
    } else if (req.method === "GET" && req.url == "/user-stats"){
        const username = getLoggedInUser(req);
        if (!username) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Not logged in" }));
            return;
        }
        const users = readUsers();
        const user = users.find(u => u.username === username);
        if (!user) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "User not found" }));
            return;
        }
        giveDefaultSkins(user);
        writeUsers(users);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({
            username: user.username,
            highScore: user.highScore,
            totalScore: user.totalScore,
            ownedSkins: user.ownedSkins,
            selectedSkin: user.selectedSkin
        }));
    } else if (req.method === "POST" && req.url === "/save-score") {
        const username = getLoggedInUser(req);
        if (!username) {
            res.writeHead(401, { "Content-Type": "text/plain" });
            res.end("Not logged in");
            return;
        }
        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });
        req.on("end", () => {
            const data = JSON.parse(body);
            const score = Number(data.score);
            const users = readUsers();
            const user = users.find(u => u.username === username);
            if (!user) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end("User not found");
                return;
            }
            giveDefaultSkins(user);
            let newHighScore = false;
            if (score > user.highScore) {
                user.highScore = score;
                newHighScore = true;
            }
            user.totalScore += score;
            writeUsers(users);
            res.writeHead(200, {"Content-Type" : "application/json"});
            res.end(JSON.stringify({
                message: newHighScore ? "New High Score" : "Score Saved",
                highScore: user.highScore,
                totalScore: user.totalScore,
                newHighScore: newHighScore
            }));
        });
    } else if (req.method === "POST" && req.url === "/buy-skin") {
        const username = getLoggedInUser(req);
        if (!username) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not logged in" }));
            return;
        }

        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const data = JSON.parse(body);
            const skin = data.skin;

            const skinPrices = {
                blueSnake: 10,
                purpleSnake: 15,
                goldSnake: 25
            };

            const users = readUsers();
            const user = users.find(u => u.username === username);

            if (!user) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "User not found" }));
                return;
            }

            giveDefaultSkins(user);

            if (!skinPrices[skin]) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Invalid skin" }));
                return;
            }

            if (user.ownedSkins.includes(skin)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "You already own this skin" }));
                return;
            }

            if (user.totalScore < skinPrices[skin]) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "Not enough points" }));
                return;
            }

            user.totalScore -= skinPrices[skin];
            user.ownedSkins.push(skin);
            writeUsers(users);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                message: "Skin bought!",
                totalScore: user.totalScore,
                ownedSkins: user.ownedSkins
            }));
        });
    } else if (req.method === "POST" && req.url === "/equip-skin") {
        const username = getLoggedInUser(req);
        if (!username) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Not logged in" }));
            return;
        }

        let body = "";
        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const data = JSON.parse(body);
            const skin = data.skin;

            const users = readUsers();
            const user = users.find(u => u.username === username);

            if (!user) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "User not found" }));
                return;
            }

            giveDefaultSkins(user);

            if (!user.ownedSkins.includes(skin)) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ message: "You do not own this skin" }));
                return;
            }

            user.selectedSkin = skin;
            writeUsers(users);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({
                message: "Skin equipped! Go back to the game to see it.",
                selectedSkin: user.selectedSkin
            }));
        });
    } else if (req.method === "GET" && req.url === "/logout") {
        const cookie = req.headers.cookie;
        if (cookie) {
            const cookies = cookie.split(";");
            for (let i = 0; i < cookies.length; i++) {
                const parts = cookies[i].trim().split("=");
                if (parts[0] === "sessionId") {
                    delete sessions[parts[1]];
                }
            }
        }
        res.writeHead(302, {
            "Location": "/",
            "Set-Cookie": "sessionId=; Max-Age=0"
        });
        res.end();
        }  else if (req.method === "GET" && req.url === "/leaderboard") {
        const username = getLoggedInUser(req);
        if (!username) {
            res.writeHead(302, { "Location": "/" });
            res.end();
            return;
        }
        const html = fs.readFileSync("leaderboard.html");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(html);

    } else if (req.method === "GET" && req.url === "/leaderboard-data") {
        const users = readUsers();
        users.sort((a, b) => b.highScore - a.highScore);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(users));
    } else {
            res.writeHead(404);
            res.end("Not Found");
        }
});

server.listen(PORT, () => {
    console.log("Server running on http://localhost:8080");
});
