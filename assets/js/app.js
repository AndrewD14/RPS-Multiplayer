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
var activeOtherPlayerNum = 0;

//event trigger for when new child is added to users
database.ref("/users").on("child_added", function(snapshot){
	//gets the players count
	database.ref().once("value").then(function(snapshot2){
		playerCount = 0; //resets since this is called for all childs when a page loads
		for(i in snapshot2.val().users){
			playerCount++;
			database.ref("/users/"+i).once("value").then(function(snapshot3){
				activeOtherPlayerNum = snapshot3.val().player;

				var wins = snapshot3.val().wins;
				var losses = snapshot3.val().losses;

				//displays the player's name if others are active
				if(activeOtherPlayerNum == 1){
					$("#playerName1").html(snapshot3.val().userName);
					$("#player1 #wins #win-totals").html(wins);
					$("#player1 #losses #loss-totals").html(losses);
				}
				else if(activeOtherPlayerNum == 2){
					$("#playerName2").html(snapshot3.val().userName);
					$("#player2 #wins #win-totals").html(wins);
					$("#player2 #losses #loss-totals").html(losses);
				}
			});
		}

		if(playerCount < 2)
			database.ref("turn").set(-1);
		else
			database.ref("turn").set(1);
	});
})

//create user in firebase
function addUser(name){
	var users = database.ref("/users");
	var key = "";

	//checks to see if there are 2 players
	if(playerCount == 0 || playerCount == 1){
		//adds player 1
		if(activeOtherPlayerNum == 2 || activeOtherPlayerNum == 0){
			key = users.push({
				userName: name,
				player: 1,
				wins: 0,
				losses: 0,
				choice: ""
			});
		}
		//adds player 2
		else if(activeOtherPlayerNum == 1){
			key = users.push({
				userName: name,
				player: 2,
				wins: 0,
				losses: 0,
				choice: ""
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
		rock.attr("data", "rock");
		rock.addClass("choice");

		var paper = $("<p>");
		paper.html("Paper");
		paper.attr("data", "paper");
		paper.addClass("choice");

		var scissor = $("<p>");
		scissor.html("Scissor");
		scissor.attr("data", "scissor");
		scissor.addClass("choice");

		if(playerNum == 1){
			$("#player1").prepend(scissor);
			$("#player1").prepend(paper);
			$("#player1").prepend(rock);
		}
		else if(playerNum == 2){
			$("#player2").prepend(scissor);
			$("#player2").prepend(paper);
			$("#player2").prepend(rock);
		}
	});
}

//function to trigger which choice was picked
function selectChoice(){
	var option = $(this).attr("data");
	database.ref("/users/"+player+"/choice").set(option);

	$(".choice").unbind("click");

	database.ref("/users/"+player).once("value", function(snapshot){
		if(snapshot.val().player == 1){
			database.ref("turn").set(2);
		}
		else
			database.ref("turn").set(0);
	});
}

//event trigger for when turn is updated
database.ref("turn").on("value", function(snapshot){
	$("#results").empty();
	if(snapshot.val() == 1){
		$("#results").html("Waiting on player 1.");

		//activates the player 1's buttons
		database.ref("/users/"+player).once("value", function(snapshot2){
			if(snapshot2.child("player").exists() && snapshot2.val().player == 1)
				$(".choice").on("click", selectChoice);
		});
	}
	else if(snapshot.val() == 2){
		$("#results").html("Waiting on player 2.");

		//activates the player 2's buttons
		database.ref("/users/"+player).once("value", function(snapshot2){
			if(snapshot2.child("player").exists() && snapshot2.val().player == 2)
				$(".choice").on("click", selectChoice);
		});
	}
	else if(snapshot.val() == 0){
		determineResults();
	}
})

//function to update results
function determineResults(){
	var p1 = {key: "", choice: ""};
	var p2 = {key: "", choice: ""};

	$("#results").empty();

	//grabs the 2 player's choices
	database.ref("/users").once("value", function(snapshot){
		for(i in snapshot.val()){
			database.ref("/users/"+i).once("value").then(function(snapshot2){
				if(snapshot2.val().player == 1){
					p1.choice = snapshot2.val().choice;
					p1.key = snapshot2.ref.key;
				}
				else{
					p2.choice = snapshot2.val().choice;
					p2.key = snapshot2.ref.key;
				}

				if(p1.key != "" && p2.key != "")
					determineWinner(p1, p2);
			});
		}
	});
}

//determines the winner
function determineWinner(p1, p2){
	if(p1.choice === "rock"){
		if(p2.choice === "paper"){
			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(1, snapshot.val().losses+1);
			});

			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/wins").set(snapshot.val().wins+1);
				updateWins(2, snapshot.val().wins+1);
			});
		}

		if(p2.choice === "scissor"){
			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(2, snapshot.val().losses+1);
			});

			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/wins").set(snapshot.val().wins+1);
				updateWins(1, snapshot.val().wins+1);
			});
		}
	}//player 1 chose rock
	else if(p1.choice === "paper"){
		if(p2.choice === "scissor"){
			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(1, snapshot.val().losses+1);
			});

			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/wins").set(snapshot.val().wins+1);
				updateWins(2, snapshot.val().wins+1);
			});
		}

		if(p2.choice === "rock"){
			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(2, snapshot.val().losses+1);
			});

			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/wins").set(snapshot.val().wins+1);
				updateWins(1, snapshot.val().wins+1);
			});
		}
	}//player 1 chose paper
	else if(p1.choice === "scissor"){
		if(p2.choice === "rock"){
			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(1, snapshot.val().losses+1);
			});

			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/wins").set(snapshot.val().wins+1);
				updateWins(2, snapshot.val().wins+1);
			});
		}

		if(p2.choice === "paper"){
			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(2, snapshot.val().losses+1);
			});

			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/wins").set(snapshot.val().wins+1);
				updateWins(1, snapshot.val().wins+1);
			});
		}
	}//player 1 chose scissor

	//clears the selected choice
	database.ref("/users/"+p1.key+"/choice").set("");
	database.ref("/users/"+p2.key+"/choice").set("");

	//sets the timer to let results stay for a bit
	setTimeout(function(){
			database.ref("turn").set(1);
		},
		4000);
}

//update the html with the new win totals
function updateWins(player, total){
	$("#player"+player+" #wins #win-totals").html(total);
}


//update the html with the new loss totals
function updateLosses(player, total){
	$("#player"+player+" #losses #loss-totals").html(total);
}