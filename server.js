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
    } else if (req.method === "GET" && req.url === "/game.js") {
        const js = fs.readFileSync("game.js");
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
                scores: []
            };
            users.push(newUser);
            writeUsers(users);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Registration successful!");
        });
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
            user.scores.push(score);
            if (score > user.highScore) {
                user.highScore = score;
            }
            writeUsers(users);
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Score saved");
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
    } else {
        res.writeHead(404);
        res.end("Not Found");
    }
});

server.listen(PORT, () => {
    console.log("Server running on http://localhost:8080");
});