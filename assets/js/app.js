// Initialize Firebase
var config = {
	apiKey: "AIzaSyDOZRHuqwPH2mkFdqMEAgtTLjwNlSKKs4o",
	authDomain: "rps-bootcamp.firebaseapp.com",
	databaseURL: "https://rps-bootcamp.firebaseio.com",
	projectId: "rps-bootcamp",
	storageBucket: "rps-bootcamp.appspot.com",
	messagingSenderId: "348981604642"
};

firebase.initializeApp(config);

var database = firebase.database();

//global variables
var player = "";
var playerCount = 0;
var userName = "";
var disconnetRef = "";
var activePlayerNum = 0;

//updates the player count
database.ref("/users").on("child_added", function(snapshot){
	database.ref().once("value").then(function(snapshot2){
		playerCount = 0; //resets since this is called for all childs when a page loads
		for(i in snapshot2.val().users){
			playerCount++;
			database.ref("/users/"+i).once("value").then(function(snapshot3){
				activePlayerNum = snapshot3.val().player;
				console.log(snapshot3.val().player)
			});
		}
	});
})

//create user in firebase
function addUser(name){
	var users = database.ref("/users");
	var key = "";

	//adds player 1
	if(playerCount == 0 || playerCount == 1){
		if(activePlayerNum == 2 || activePlayerNum == 0){
			key = users.push({
				userName: name,
				player: 1
			});
		}
		//adds player 2
		else if(activePlayerNum == 1){
			key = users.push({
				userName: name,
				player: 2
			});
		}
	}

	//stores the player's key
	player = key.key;

	//disconnect event
	if(player != "")
		disconnetRef = database.ref("/users/"+player).onDisconnect().remove();
}

//click function for joining the game
function logIn(){
	// prevent form from submitting with event.preventDefault() or returning false
	event.preventDefault();

	userName = $("#userName").val().trim();
	addUser(userName);

	//removes the log in form
	$("#join").remove();
}