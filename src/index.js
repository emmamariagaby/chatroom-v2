const socket = io();
let username = "";


const getRooms = () => fetch("http://localhost:3000/rooms").then((response) => {
    return response.json()
}).then((rooms) => {
    populateRoomsLists(rooms)
});

/** Add event listener to main DOM elements */
function setupEventListeners() {

    // To Lobby on submit
    const joinLobby = document.querySelector('form.nic-name')
    joinLobby.addEventListener('submit', onJoinLobby)

    // Join room on submit
    const joinRoom = document.querySelector('form.join')
    joinRoom.addEventListener('submit', onJoinRoom)

    // Send messages on submit
    const messageChat = document.querySelector('.chat form')
    messageChat.addEventListener('submit', onSendMessage)

    // Leave chat on submit
    const leaveChat = document.querySelector('.chat-leave')
    leaveChat.addEventListener('submit', onLeaveRoom)
}

function onJoinLobby(event) {
    event.preventDefault()
    const [nameInput] = document.querySelectorAll('.join-lobby input')
    const message = document.querySelector('.welcome-lobby')
    const name = nameInput.value
    const welcome = "Welcome to the Lobby "
    const h2 = document.createElement('h2')

    document.querySelector('.join-lobby').classList.add('hidden')
    document.querySelector('.aside').classList.remove('hidden')
    document.querySelector('.join-room').classList.remove('hidden')

    h2.innerText = `${welcome} ${name}!`
    message.appendChild(h2)
    getRooms();

    //socket.emit('rooms', { name })
}
