const path = require("path");
const http = require("http");
const express = require("express");
const WebSocket = require("ws");
const {sendAllFilms, sendAllHalls, sendSession, WsClients, WsSessions} = require("./entities/clients");
const app = express();
const {PORT, adminPass} = require('./entities/config');

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.static(path.resolve(__dirname, "static")));

app.get("/", (req, res) => res.render("home"));
app.get("/film", (req, res) => res.render("film"));
app.get("/hall", (req, res) => res.render("hall"));
app.get("/session", (req, res) => res.render("session"));

const server = http.createServer(app);
const serverInfo = {
	wsServer: new WebSocket.Server({ server }),
	wsClientsFilm: new WsClients(),
	wsClientsHall: new WsClients(),
	wsSessions: new WsSessions()
};

function wsClientsStart(wsClients, ws, WScallback) {
	wsClients.add(ws, serverInfo);
	WScallback(ws);
	ws.on("error", () => ws.close());
	ws.on("close", () => wsClients.remove(ws));
}

serverInfo.wsServer.on("connection", async (ws, req) => {
	ws.isAdmin = req.headers.cookie.includes('admin-secret-key=' + adminPass);
	if (req.url === '/' || req.url === '/film') {
		wsClientsStart(serverInfo.wsClientsFilm, ws, sendAllFilms);
	} else if (req.url === '/hall') {
		wsClientsStart(serverInfo.wsClientsHall, ws, sendAllHalls);
	} else if (req.url.substring(0, 8) === '/session') {
		const sessionId = new URLSearchParams(req.url.substring(8))
			.get('session-id');
		serverInfo.wsSessions.add(ws, sessionId, serverInfo);
		ws.on("error", () => ws.close());
		ws.on("close", () => serverInfo.wsSessions.remove(ws));
		sendSession(ws, sessionId, false);
	}
});

server.listen(PORT, () => {
	console.log(`Server started on port ${PORT}`);
});
