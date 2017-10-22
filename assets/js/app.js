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

//event trigger for when new child is added to users
database.ref("/users").on("child_added", function(snapshot){
	//gets the players count
	database.ref().once("value").then(function(snapshot2){
		playerCount = 0; //resets since this is called for all childs when a page loads
		for(i in snapshot2.val().users){
			playerCount++;
			database.ref("/users/"+i).once("value").then(function(snapshot3){
				activePlayerNum = snapshot3.val().player;

				var wins = snapshot3.val().wins;
				var losses = snapshot3.val().losses;

				//displays the player's name if others are active
				if(activePlayerNum == 1){
					$("#playerName1").html(snapshot3.val().userName);
					$("#player1 #wins #win-totals").html(wins);
					$("#player1 #losses #loss-totals").html(losses);
				}
				else if(activePlayerNum == 2){
					$("#playerName2").html(snapshot3.val().userName);
					$("#player2 #wins #win-totals").html(wins);
					$("#player2 #losses #loss-totals").html(losses);
				}
			});
		}
	});
})

//create user in firebase
function addUser(name){
	var users = database.ref("/users");
	var key = "";

	//checks to see if there are 2 players
	if(playerCount == 0 || playerCount == 1){
		//adds player 1
		if(activePlayerNum == 2 || activePlayerNum == 0){
			key = users.push({
				userName: name,
				player: 1,
				wins: 0,
				losses: 0
			});
		}
		//adds player 2
		else if(activePlayerNum == 1){
			key = users.push({
				userName: name,
				player: 2,
				wins: 0,
				losses: 0
			});
		}
	}

	//stores the player's key
	player = key.key;

	//disconnect event
	if(player != ""){
		disconnetRef = database.ref("/users/"+player).onDisconnect().remove();
		displayCurrentPlayer();
	}
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

//display player
function displayCurrentPlayer(){
	var playerNum;
	var playerName;
	database.ref("/users/"+player).once("value").then(function(snapshot2){
		playerName = snapshot2.val().userName;
		$("#name").html(playerName);
		
		playerNum = snapshot2.val().player;
		$("#playerNum").html(playerNum);

		var rock = $("<p>");
		rock.html("Rock");
		rock.attr("data", "r");
		rock.addClass("choice");

		var paper = $("<p>");
		paper.html("Paper");
		paper.attr("data", "p");
		paper.addClass("choice");

		var scissor = $("<p>");
		scissor.html("Scissor");
		scissor.attr("data", "s");
		scissor.addClass("choice");

		if(playerNum == 1){
			$("#player1").append(rock);
			$("#player1").append(paper);
			$("#player1").append(scissor);
		}
		else if(playerNum == 2){
			$("#player2").append(rock);
			$("#player2").append(paper);
			$("#player2").append(scissor);
		}
	});
}