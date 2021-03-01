const express = require('express')
const socketIO = require('socket.io')
const http = require('http')

const app = express()
const server = http.createServer(app)
const io = socketIO(server)

const JOIN_MESSAGE = " has joined the room!";
const LEAVE_MESSAGE = " has left the room!";
const AUTH_FAILED = "Authentication failed, try again...";
const CONNECTION = "connection";
const DISCONNECT = "disconnect";
const JOIN_SUCCESSFUL = "join successful";
const CHECK_IF_EXISTS = "check if exists";
const MESSAGE = "message";
const UPDATE_CHAT = "update chat";
const UPDATE_LIST = "update list";
const JOIN_ROOM = "join room";
const VERIFY_LOCKED_ROOM = "verify locked room";
const ON_ERROR = "on error";

let rooms = [
    { id: 'admin', members: [0], password: '123' },
    { id: 'general', members: [0] }
];

app.use(express.static('public'))

app.get("/rooms", (res) => {
    res.json(rooms)
})

io.on(CONNECTION, (socket) => {
    
    socket.on(JOIN_ROOM, (data) => {
        roomHandler(socket, data)
    })

    socket.on(VERIFY_LOCKED_ROOM, (data) => {
        const exists = rooms.filter(room => room.id === data.room.id)
        if (exists.length > 0) {
            const foundIndex = rooms.findIndex(room => room.id === data.room.id)
            if (data.room.password === rooms[foundIndex].password) {
                roomHandler(socket, data)
            } else { socket.emit(ON_ERROR, AUTH_FAILED) }
        } else {
            roomHandler(socket, data)
        } 
    })

    socket.on(CHECK_IF_EXISTS, (roomId) => {
        roomExists(roomId)
    })
})

function roomHandler(socket, data) {
    socket.join(data.room.id, () => {
        
        io.to(socket.id).emit(JOIN_SUCCESSFUL, data.room.id)
        socket.username = data.username;
        socket.room = data.room;
        io.to(data.room.id).emit(UPDATE_CHAT, { username: socket.username, message: JOIN_MESSAGE })
        
        const exists = rooms.filter(room => room.id === data.room.id)
        if (exists.length < 0) {
            rooms.push(data.room)
        } 
        
        socket.on(DISCONNECT, () => {
            rooms.forEach((room) => {
                if (room.id === data.room.id) room.members--;
                io.to(data.room.id).emit(UPDATE_CHAT, { username: socket.username, message: LEAVE_MESSAGE })
                if (room.members < 1) {
                    if (room.id != "public" && room.id != "general") {
                        rooms.splice(rooms.findIndex(room => room.id === data.room.id), 1);
                        socket.emit(UPDATE_LIST);
                    }
                }
            });     
        })

        socket.on(MESSAGE, (message) => {
            io.to(data.room.id).emit(UPDATE_CHAT, { username: socket.username, message })
        })

        const index = rooms.findIndex(room => room.id === data.room.id);
        rooms[index].members++;
    })
}

function roomExists(roomId) {
    const exists = rooms.filter(room => room.id === roomId)
    if (exists.length > 0) {
        return true;
    } else {
        return false;
    }
}

server.listen(console.log("Server is running on http://localhost:3000"));