const db = require('./Database');

function sendAllFilms(ws) {
    db.selectAllFilms((el) => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(el));
        }
    });
}

function sendAllHalls(ws) {
    db.selectAllHalls((el) => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(el));
        }
    });
}

function sendSession(ws, sessionID) {
    db.selectSession(sessionID, ws.isAdmin, (el) => {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(el));
        }
    });
}

module.exports.sendAllFilms = sendAllFilms;
module.exports.sendAllHalls = sendAllHalls;
module.exports.sendSession = sendSession;

function workWithData(data, ws, serverInfo) {
    console.log(data);
    switch(data.type){
        case 'addFilm':
            if(ws.isAdmin) {
                db.addFilm(data.film, () => {
                    serverInfo.wsClientsFilm.forEach((ws) => 
                    sendAllFilms(ws))});
            }
            break;
        case 'delFilm':
            if(ws.isAdmin) {
                db.delFilm(data.id, () => {
                    serverInfo.wsClientsFilm.forEach((ws) => 
                    sendAllFilms(ws))});
            }
            break;
        case 'addHall':
            if(ws.isAdmin) {
                db.addHall(data.hall, () => {
                    serverInfo.wsClientsHall.forEach((ws) => 
                    sendAllHalls(ws))});
            }
            break;
        case 'delHall':
            if(ws.isAdmin) {
                db.delHall(data.id,  () => {
                    serverInfo.wsClientsHall.forEach((ws) => 
                    sendAllHalls(ws))});
            }
            break;
        case 'addSession': 
            if(ws.isAdmin) {
                db.addSession(data.session, () => {
                    serverInfo.wsClientsFilm.forEach((ws) => 
                    sendAllFilms(ws))});
            }
            break;
        case 'delSession': 
            if(ws.isAdmin) {
                db.delSession(data.id, () => {
                    serverInfo.wsClientsFilm.forEach((ws) => 
                    sendAllFilms(ws))});
            }
            break;
    }
}

function workWithSession(data, ws, sessionId, serverInfo) {
    console.log(data);
    switch(data.type) {
        case 'addPlace':
            db.addPlace(data.data, () => {
                serverInfo.wsSessions.forEach(sessionId, (ws) => 
                sendSession(ws, sessionId))});
            break;
        case 'removePlace':
            db.removePlace(data.data, ws.isAdmin, () => {
                serverInfo.wsSessions.forEach(sessionId, (ws) => 
                sendSession(ws, sessionId))});
            break;
        case 'movePlace':
            if(ws.isAdmin) {
                db.movePlace(data.data, () => {
                    serverInfo.wsSessions.forEach(sessionId, (ws) => 
                    sendSession(ws, sessionId))});
            }
            break;
    }
}

module.exports.WsClients = class WsClients {
    constructor() {
        this.clients = [];
    }

    add(ws, serverInfo) {
        this.clients.push(ws);
        ws.on('message', (message) => {
            const data = JSON.parse(message);
            workWithData(data, ws, serverInfo);
        });
    }

    remove(ws) {
        ws.onmessage = undefined;
        this.clients = this.clients.filter((client) => client !== ws);
    }

    forEach(callback) {
        this.clients.forEach((client) => callback(client));
    }
}

module.exports.WsSessions = class WsSessions {
    constructor() {
        this.clients = new Map();
    }

    add(ws, sessionId, serverInfo) {
        if(this.clients.has(sessionId)) {
            this.clients.get(sessionId).push(ws);
        } else {
            this.clients.set(sessionId, [ws]);
        }
        ws.on('message', (message) => {
            const data = JSON.parse(message);
            workWithSession(data, ws, sessionId, serverInfo);
        });
    }

    remove(ws) {
        ws.onmessage = undefined;
        for(let id of Array.from( this.clients.keys() )) {
            this.clients.set(id, this.clients.get(id).filter((client => client !== ws)));
        }
    }

    forEach(sessionId, callback) {
        if(this.clients.has(sessionId)){
            this.clients.get(sessionId).forEach((client) => callback(client));
        }
    }
}