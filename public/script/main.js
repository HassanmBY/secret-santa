"use strict";
//#region Hoisting
const formBtn = document.querySelector("#submitForm"),
	form = document.querySelector("#form"),
	infoZone = document.querySelector("#infoZone"),
	messagesZone = document.querySelector("#messagesZone"),
	connectedUsers = document.querySelector("#connectedUsers"),
	readyBtn = document.querySelector("#ready"),
	readyBtnText = document.querySelector("#readyBtnText"),
	title = document.querySelector("#title"),
	readyCounter = document.querySelector("#readyUsers"),
	connectedUsersCount = document.querySelector("#connectedUsersCount"),
	timerLeft = document.querySelector("#timerLeft"),
	giverReceiver = document.querySelector("#giverReceiver"),
	body = document.querySelector("body"),
	start = document.querySelector("#startBtn"),
	socket = io();
//#endregion

function init() {
	function startGame() {
		start.style.display = "none";
		form.style.display = "flex";
	}

	function themeMusic() {
		const music = new Audio();
		music.src = "../medias/audios/theme-music.mp3";
		music.loop = true;
		music.volume = 0.1;
		music.play();
	}

	function createClickSound() {
		let clickSound = new Audio();
		clickSound.src = "../medias/audios/interface.mp3";
		clickSound.load();
		return clickSound;
	}
	const clickSound = createClickSound();

	body.addEventListener("click", () => {
		clickSound.currentTime = 0;
		clickSound.play();
	});

	start.addEventListener("click", () => {
		setTimeout(() => {
			startGame();
		}, 500);
		themeMusic();
	});
}
init();
//#region Create new user/socket
function submitName(e) {
	e.preventDefault();
	let userName = document.querySelector("#name").value;
	if (userName == "") userName = "Anonymous user";
	socket.emit("new_user", userName);
	userName = "";
	form.style.display = "none";
	infoZone.style.display = "flex";
	toggleReadyState();
}
form.addEventListener("submit", submitName);
formBtn.addEventListener("click", submitName);
//#endregion

//#region Set user name on Title
socket.on("set_username", username => {
	// console.log(username);
	title.innerHTML = `Welcome to the Secret Santa Game ${username}`;
});

//#endregion

//#region Update Users List
socket.on("update_users", data => {
	let users = data;
	// console.log(users);
	connectedUsers.innerHTML = "<dt>Connected Users</dt>";
	for (const property in users) {
		let userElem = document.createElement("li");
		userElem.innerText = users[property]._name;
		connectedUsers.appendChild(userElem);
	}
});
// TODO execute the code above when an user connects or disconnects from the server
//#endregion

//#region online_players
socket.on("online_players", connectedUsers => {
	connectedUsersCount.innerText = connectedUsers;
});
//#endregion

//#region Toggle Ready State

let userIsReady = false;

function toggleReadyState() {
	if (userIsReady) {
		socket.emit("ready_player", -1);
		readyBtnText.innerHTML = "Ready&nbsp!";
		userIsReady = false;
	} else {
		socket.emit("ready_player", 1);
		readyBtnText.innerHTML = "Not Ready&nbsp!";
		userIsReady = true;
	}
	socket.emit("toggle_ready_state");
	socket.on("update_ready_users", readyUsersNum => {
		readyCounter.innerHTML = `${readyUsersNum}`;
	});
	socket.emit("are_all_ready");
}
readyBtn.addEventListener("click", toggleReadyState);
//#endregion

//#region Timer
socket.on("counter", count => {
	timerLeft.innerText = count;
});
//#endregion
//#region Pair Up
socket.on("pair_up_players", obj => {
	let text = [],
		newPlayerSound = new Audio();
	newPlayerSound.src = "../medias/audios/short-success.mp3";
	function displayPaired(delay, username) {
		setTimeout(() => {
			text.push(username);
			giverReceiver.innerText = text.join(" => ");
			newPlayerSound.play();
		}, 3000 * delay);
	}

	function gameFinished() {
		setTimeout(() => {
			let endSound = new Audio();
			endSound.src = "../medias/audios/success.mp3";
			endSound.play();
		}, 3000 * Object.keys(obj).length + 1000);
	}

	infoZone.style.display = "none";
	title.innerText = "Résultats";
	let index = 0;
	for (const prop in obj) {
		displayPaired(index, obj[prop]);
		index++;
	}
	gameFinished();
});
//#endregion

//#region Append new message
function appendMessages(message, className) {
	const messageElement = document.createElement("p");
	messageElement.classList.add(className);
	messageElement.innerText = message;
	messagesZone.prepend(messageElement);
}

socket.on("connection_log", name => {
	appendMessages(`${name} has connected`, "connected");
});

socket.on("disconnection_log", name => {
	appendMessages(`${name} has disconnected`, "disconnected");
});
//#endregion
