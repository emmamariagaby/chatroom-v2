const socket = io();

let roomHolder = [];
let currentRoom;
let currentUser;
let host = "http://localhost:3000/rooms";

const getRooms = () =>
  fetch(host)
    .then((response) => {
      return response.json();
    })
    .then((rooms) => {
      roomHolder = rooms;
      populateRoomsLists(rooms);
    });

function populateRoomsLists(roomHolder) {
  const open = document.querySelector(".open-rooms ul");
  open.innerText = "";
  const locked = document.querySelector(".locked-rooms ul");
  locked.innerText = "";

  roomHolder.forEach((room) => {
    const li = document.createElement("li");
    li.innerText = room.id;
    li.onclick = function () {
      clickToJoinRoom(li.innerText);
    };
    if (room.password) {
      locked.append(li);
    } else {
      open.append(li);
    }
  });
}

window.addEventListener("load", () => {
  setupEventListeners();
});

/** Add event listener to main DOM elements */
function setupEventListeners() {
  // To Lobby on submit
  const joinLobby = document.querySelector("form.nic-name");
  joinLobby.addEventListener("submit", onJoinLobby);

  // Join room on submit
  const joinRoom = document.querySelector("form.join");
  joinRoom.addEventListener("submit", onJoinRoom);

  // Send messages on submit
  const messageChat = document.querySelector(".chat form");
  messageChat.addEventListener("submit", onSendMessage);

  // Leave chat on submit
  const leaveChat = document.querySelector(".chat-leave");
  leaveChat.addEventListener("click", onLeaveRoom);
}

function onJoinLobby(event) {
  event.preventDefault();
  const [nameInput] = document.querySelectorAll(".join-lobby input");
  const message = document.querySelector(".welcome-lobby");
  currentUser = nameInput.value;
  const welcomeMessage = "Welcome to the Lobby ";
  const h2 = document.createElement("h2");

  document.querySelector(".join-lobby").classList.add("hidden");
  document.querySelector(".aside").classList.remove("hidden");
  document.querySelector(".join-room").classList.remove("hidden");

  h2.innerText = `${welcomeMessage} ${currentUser}!`;
  message.appendChild(h2);
  getRooms();
}

function onJoinRoom(event) {
  event.preventDefault();
  socket.connect();
  const [roomInput] = document.querySelectorAll(".join input");
  const [passwordInput] = document.querySelectorAll(".password");

  const id = roomInput.value;
  const username = currentUser;
  const password = passwordInput.value;

  const index = roomHolder.findIndex((roomX) => roomX.id === id);
  let members = 0;
  if (index != -1) {
    members = roomHolder[index].members;
  }

  let room = undefined;
  if (password === "" || password == undefined || password == null) {
    room = { id, members };
  } else {
    room = { id, members, password };
  }

  currentRoom = room;
  socket.emit("join room", { username, room });
}

function clickToJoinRoom(id) {
  let username = currentUser;
  let index = roomHolder.findIndex((room) => room.id === id);
  let members = 0;
  let password = undefined;
  if (index != -1) {
    if (roomHolder[index].password) {
      password = roomHolder[index].password;
    }
    members = roomHolder[index].members;
  }

  let room = undefined;
  if (password === undefined) {
    room = { id, members };
  } else {
    password = prompt("Enter a password:");
    room = { id, members, password };
  }

  currentRoom = room;
  socket.emit("join room", { username, room });
}

function onSendMessage(event) {
  event.preventDefault();
  const input = document.querySelector(".chat form input");
  socket.emit("message", {
    username: currentUser,
    message: input.value,
    id: currentRoom.id,
  });
  input.value = "";
}

function onReceivedMessage(data) {
  const ul = document.querySelector(".chat ul");
  const li = document.createElement("li");
  li.innerText = `${data.username}: ${data.message}`;
  ul.append(li);
}

function joinChatRoom() {
  document.getElementById("messages").innerHTML = "";
  document.querySelector(".join-room").classList.add("hidden");
  document.querySelector(".chat").classList.remove("hidden");
}

function onLeaveRoom() {
  socket.emit("leave room", currentRoom);
  document.querySelector(".join-room").classList.remove("hidden");
  document.querySelector(".chat").classList.add("hidden");
  let passwordField = document.getElementById("password");
  let roomField = document.getElementById("room");
  passwordField.value = "";
  roomField.value = "";

  passwordField.classList.add("hidden");
  document.getElementById("checkbox").checked = false;
}

function usePassword() {
  let checkBox = document.querySelector("#checkbox");
  let input = document.querySelector("#password");
  if (checkBox.checked == true) {
    input.classList.remove("hidden");
  } else {
    input.classList.add("hidden");
  }
}

socket.on("join successful", () => {
  joinChatRoom();
});
socket.on("update chat", (data) => {
  onReceivedMessage(data);
});
socket.on("update list", () => {
  getRooms();
});

socket.on("auth failed", (data) => {
  let errorLabel = document.getElementById("errorMessage");
  errorLabel.innerHTML = data;
  errorLabel.style.visibility = "visible";

  window.setTimeout(function () {
    if (errorLabel != null) {
      errorLabel.style.visibility = "hidden";
    }
  }, 3000);
});
