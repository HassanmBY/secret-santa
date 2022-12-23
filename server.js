//#region Hoisting
const express = require("express"),
	app = express(),
	http = require("http").Server(app),
	io = require("socket.io")(http),
	PORT = 3000;
//#endregion
//#region Hoisted Variables
let usersList = {},
	connectedUsers = 0,
	readyUsersNumber = 0;
//#endregion

//#region MyConsole
class myConsole {
	log(args, color) {
		switch (color) {
			case "black":
				console.log("\x1b[30m%s\x1b[0m", String(args));
				break;
			case "red":
				console.log("\x1b[31m%s\x1b[0m", String(args));
				break;
			case "green":
				console.log("\x1b[32m%s\x1b[0m", String(args));
				break;
			case "yellow":
				console.log("\x1b[33m%s\x1b[0m", String(args));
				break;
			case "blue":
				console.log("\x1b[34m%s\x1b[0m", String(args));
				break;
			case "magenta":
				console.log("\x1b[35m%s\x1b[0m", String(args));
				break;
			case "cyan":
				console.log("\x1b[36m%s\x1b[0m", String(args));
				break;
			case "white":
				console.log("\x1b[37m%s\x1b[0m", String(args));
				break;
			default:
				console.log(args);
				break;
		}
	}
	clear() {
		console.clear();
	}
}
myConsole = new myConsole();

//#endregion
//#region SocketIO
io.on("connection", socket => {
	let currentUserId = socket.id;
	//#region online_players
	connectedUsers++;
	io.emit("online_players", connectedUsers);
	//#endregion

	//#region new_user
	// New user is created
	socket.on("new_user", userName => {
		usersList[currentUserId] = {
			_name: userName,
			isReady: false,
		};
		// console.log(`${usersList[currentUserId]._name} has connected`);
		// Set username on title
		socket.emit("set_username", usersList[currentUserId]._name);
		// Update connected users list
		io.emit("update_users", usersList);
		// Connection logs
		io.emit("connection_log", usersList[currentUserId]._name);
	});
	//#endregion

	//#region toggle ready state
	function getReadyUsersNum() {
		let readyUsersNum = 0;
		for (const property in usersList)
			if (usersList[property].isReady) readyUsersNum++;

		io.emit("update_ready_users", readyUsersNum);
	}
	socket.on("toggle_ready_state", () => {
		if (currentUserId in usersList)
			usersList[currentUserId].isReady =
				usersList[currentUserId].isReady == true ? false : true;
		getReadyUsersNum();
	});
	//#endregion

	//#region all ready
	socket.on("ready_player", num => {
		readyUsersNumber += num;
	});
	//#endregion

	//#region StartGame
	function startGameFct(usersList) {
		let originalArr = Object.values(usersList).map(item => item._name);
		let randomisedArr = originalArr.sort(() => Math.random() - 0.5);
		let arr1 = [...randomisedArr];
		let firstElement = randomisedArr.shift();
		randomisedArr.push(firstElement);

		const obj = arr1.reduce((accumulator, element, index) => {
			return { ...accumulator, [element]: randomisedArr[index] };
		}, {});

		io.emit("pair_up_players", obj);
	}
	//#endregoin

	//#region are all ready
	socket.on("are_all_ready", () => {
		// console.log("Ready Users: " + readyUsersNumber);
		let startGame;
		if (readyUsersNumber == connectedUsers) {
			let counter = 5;
			startGame = setInterval(() => {
				io.emit("counter", counter - 2);
				counter--;
				if (counter == 0) {
					startGameFct(usersList);
					clearInterval(startGame);
				}
			}, 1000);
		} else {
			clearInterval(startGame);
		}
	});
	// TODO: execute every time all users are ready
	//#endregion

	//#region disconnect
	socket.on("disconnect", () => {
		// console.log(usersList);
		// Display name of user leaving and delete in usersList
		let name =
			typeof usersList[currentUserId] !== "undefined" &&
			usersList[currentUserId]._name;
		// delete user from usersList
		typeof usersList[currentUserId] !== "undefined"
			? io.emit("disconnection_log", usersList[currentUserId]._name) &&
			  readyUsersNumber-- &&
			  delete usersList[currentUserId]
			: "An user";

		// Update connected users list
		io.emit("update_users", usersList);

		// console.log(`${name} has disconnected`);
		connectedUsers--;
		io.emit("online_players", connectedUsers);
		io.emit("update_users", usersList);
		getReadyUsersNum();
	});
	//#endregion
});
//#endregion
//#region Serve static files in /public folder
app.use(express.static("public"));
//#endregion
//#region server start
http.listen(PORT, () => {
	myConsole.clear();
	myConsole.log("/**********************************************/", "red");
	myConsole.log("Listening on port: " + PORT, "cyan");
	myConsole.log(`Link to app : http://localhost:${PORT}`, "cyan");
	myConsole.log("/**********************************************/", "red");
});
//#endregion
