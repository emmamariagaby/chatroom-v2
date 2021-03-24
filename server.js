const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
io.set('heartbeat timeout', 60000);
io.set('heartbeat interval', 25000);

const JOIN_MESSAGE = " has joined the room!";
const LEAVE_MESSAGE = " has left the room!";
const AUTH_FAILED_MESSAGE = "Password authentication failed";
const AUTH_FAILED = "auth failed";
const CONNECTION = "connection";
const DISCONNECT = "disconnect";
const JOIN_SUCCESSFUL = "join successful";
const MESSAGE = "message";
const UPDATE_CHAT = "update chat";
const UPDATE_LIST = "update list";
const JOIN_ROOM = "join room";
const LEAVE_ROOM = "leave room";

let rooms = [
    { id: 'admin', members: 0, password: '123' },
    { id: 'general', members: 0 }
];

app.use(express.static('public'));

app.get("/rooms", (req, res) => {
    let response = JSON.stringify(rooms, replacePasswords);
    res.send(response);
});

function replacePasswords(key, value) {
    // Filtering out passwords sent to clients.
    if (key === 'password') {
        return 'censored';
    }
    return value;
}

io.on(CONNECTION, (socket) => {

    socket.on(JOIN_ROOM, (data) => {

        const exists = rooms.filter(room => room.id === data.room.id);
        if (exists.length < 1) {
            rooms.push(data.room);
            console.log(data.username + " created new room: " + data.room.id);

            socket.join(data.room.id, () => {
                io.to(socket.id).emit(JOIN_SUCCESSFUL, data.room.id)
                socket.username = data.username;
                socket.room = data.room.id;
                io.to(data.room.id).emit(UPDATE_CHAT, { username: socket.username, message: JOIN_MESSAGE })
                const index = rooms.findIndex(room => room.id === data.room.id);
                rooms[index].members++;
                console.log(data.username + " successfully joined: " + data.room.id);
            });

        } else {
            const index = rooms.findIndex(room => room.id === data.room.id);
            if (rooms[index].password) {
                if (data.room.password === rooms[index].password) {
                    socket.join(data.room.id, () => {
                        io.to(socket.id).emit(JOIN_SUCCESSFUL, data.room.id)
                        socket.username = data.username;
                        socket.room = data.room.id;
                        io.to(data.room.id).emit(UPDATE_CHAT, { username: socket.username, message: JOIN_MESSAGE })
                        const index = rooms.findIndex(room => room.id === data.room.id);
                        rooms[index].members++;
                        console.log(data.username + " successfully joined password protected room: " + data.room.id);
                    });
                } else {
                    socket.emit(AUTH_FAILED, AUTH_FAILED_MESSAGE);
                    console.log(data.username + " entered wrong password for room: " + data.room.id + ", join failed");
                }
            } else {
                socket.join(data.room.id, () => {
                    io.to(socket.id).emit(JOIN_SUCCESSFUL, data.room.id)
                    socket.username = data.username;
                    socket.room = data.room.id;
                    io.to(data.room.id).emit(UPDATE_CHAT, { username: socket.username, message: JOIN_MESSAGE })
                    const index = rooms.findIndex(room => room.id === data.room.id);
                    rooms[index].members++;
                    console.log(data.username + " successfully joined: " + data.room.id);
                });
            }
        }
        io.sockets.emit(UPDATE_LIST);
    });

    socket.on(LEAVE_ROOM, (data) => {
        console.log(socket.username + " left room: " + data.id + ", syncing rooms")
        rooms.forEach((room) => {
            if (room.id === data.id) {
                room.members--;
                io.to(data.id).emit(UPDATE_CHAT, { username: socket.username, message: LEAVE_MESSAGE })
                if (room.members < 1) {
                    if (room.id != "admin" && room.id != "general") {
                        rooms.splice(rooms.findIndex(room => room.id === data.id), 1);
                    }
                }
                io.sockets.emit(UPDATE_LIST);
            }
        });
    });

    socket.on(DISCONNECT, () => {
        if (socket.room != undefined) {
            console.log(socket.username + " disconnected from: " + socket.room + ", syncing rooms")
            rooms.forEach((room) => {
                if (room.id === socket.room) {
                    room.members--;
                    io.to(socket.room).emit(UPDATE_CHAT, { username: socket.username, message: LEAVE_MESSAGE })
                    if (room.members < 1) {
                        if (room.id != "admin" && room.id != "general") {
                            rooms.splice(rooms.findIndex(room => room.id === socket.room), 1);
                        }
                    }
                    io.sockets.emit(UPDATE_LIST);
                }
            });
        }
    });

    socket.on(MESSAGE, (data) => {
        console.log(data.username + " sent a message in room: " + data.id);
        io.to(data.id).emit(UPDATE_CHAT, { username: data.username, message: data.message })
    });
});

server.listen(3000, () => console.log("Server is running on http://localhost:3000"));