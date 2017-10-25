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
var userName = "";
var player = "";
var playerCount = 0;
var disconnetRef = "";
var activeOtherPlayerNum = 0;
var messages = [];
var waitForNextRound;

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
			database.ref("turn").set(-1); //not enough players
		else
			database.ref("turn").set(1); //2 players have joined, set turn to player 1
	});
})

//event trigger for when new child is removed from users
database.ref("/users").on("child_removed", function(snapshot){
	//clears the results
	$("#results").empty();

	//resets the turn to not enough players
	database.ref("turn").set(-1);

	//clears the timer that has results display for a bit
	clearTimeout(waitForNextRound);

	//clears leaving player
	if(snapshot.val().player == 1){
		$("#player1 .choice").remove();

		$("#playerName1").html("Waiting for player 1");
		$("#player1 #wins #win-totals").html("");
		$("#player1 #losses #loss-totals").html("");
	}
	else if(snapshot.val().player == 2){
		$("#player2 .choice").remove();

		$("#playerName2").html("Waiting for player 2");
		$("#player2 #wins #win-totals").html("");
		$("#player2 #losses #loss-totals").html("");
	}
})

//gets the current messages when the page loads
database.ref("/message").on("child_added", function(snapshot){
	messages = snapshot.val();

	for(i in messages){
		var timePosted = new Date(messages[i].time);
		var p = $("<p>");
		p.html(timePosted.toLocaleString()+" "+messages[i].m);

		$("#message-box").append(p);
	}

	$("#message-box").scrollTop($("#message-box")[0].scrollHeight);
})

//event trigger for when messages is updated
database.ref("/message").on("child_changed", function(snapshot){
	messages = snapshot.val();

	$("#message-box").empty();

	for(i in messages){
		var p = $("<p>");
		p.html(messages[i].time+" "+messages[i].m);

		$("#message-box").append(p);
	}

	$("#message-box").scrollTop($("#message-box")[0].scrollHeight);
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
	if(player != "" && player != null){
		disconnetRef = database.ref("/users/"+player).onDisconnect().remove();
		displayCurrentPlayer();
		$("#greeting").css("display", "flex");
	}
	//displays the watcher greeting
	else{
		$("#name").html(userName);
		$("#playerNum").html("a spectator");
		$("#greeting").append($("<p>").html("You are only allowed to send messages. Please refresh the page when a player leaves to login to the game."));
		$("#greeting").css("display", "flex");
	}
}

//click function for joining the game
function logIn(){
	// prevent form from submitting with event.preventDefault() or returning false
	event.preventDefault();

	userName = $("#userName").val().trim();
	addUser(userName);

	//activates the submit button for the message
	$("#post-message").on("click", postMessage);

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
		$("#playerNum").html("player "+playerNum);

		var rock = $("<button>");
		rock.html("Rock");
		rock.attr("data", "rock");
		rock.addClass("choice");
		rock.addClass("alert alert-info");
		rock.addClass("btn-block");

		var paper = $("<button>");
		paper.html("Paper");
		paper.attr("data", "paper");
		paper.addClass("choice");
		paper.addClass("alert alert-info");
		paper.addClass("btn-block");

		var scissor = $("<button>");
		scissor.html("Scissor");
		scissor.attr("data", "scissor");
		scissor.addClass("choice");
		scissor.addClass("alert alert-info");
		scissor.addClass("btn-block");

		//makes sures both sides are cleared
		$("#player1 .choice, #choice").remove();
		$("#player2 .choice, #choice").remove();

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

	$(document.body).unbind("click", selectChoice);

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
		$("#results").html('<div class="col my-auto"><div class="row justify-content-center"><h5>Waiting for player 1</h5></div></div>');

		//activates the player 1's buttons
		database.ref("/users/"+player).once("value", function(snapshot2){
			if(snapshot2.child("player").exists() && snapshot2.val().player == 1)
				$(document.body).on("click", ".choice", selectChoice);
		});
	}
	else if(snapshot.val() == 2){
		$("#results").html('<div class="col my-auto"><div class="row justify-content-center"><h5>Waiting for player 2</h5></div></div>');

		//activates the player 2's buttons
		database.ref("/users/"+player).once("value", function(snapshot2){
			if(snapshot2.child("player").exists() && snapshot2.val().player == 2)
				$(document.body).on("click", ".choice", selectChoice);
		});
	}
	else if(snapshot.val() == 0){
		determineResults();
	}
})

//function to update results
function determineResults(){
	var p1 = {key: "", choice: "", name: ""};
	var p2 = {key: "", choice: "", name: ""};

	$("#results").empty();

	//grabs the 2 player's choices
	database.ref("/users").once("value", function(snapshot){
		for(i in snapshot.val()){
			database.ref("/users/"+i).once("value").then(function(snapshot2){
				if(snapshot2.val().player == 1){
					p1.choice = snapshot2.val().choice;
					p1.key = snapshot2.ref.key;
					p1.name = snapshot2.val().userName;
				}
				else{
					p2.choice = snapshot2.val().choice;
					p2.key = snapshot2.ref.key;
					p2.name = snapshot2.val().userName;
				}

				if(p1.key != "" && p2.key != "")
					determineWinner(p1, p2);
			});
		}
	});
}

//determines the winner
function determineWinner(p1, p2){
	//clears the choices
	$("#player1 .choice, #choice").remove();
	$("#player2 .choice, #choice").remove();

	//displays what was picked for player 1
	var picked = $("<h5>");
	picked.attr("id", "choice");
	picked.html(p1.choice);
	$("#player1").prepend(picked);

	//displays what was picked for player 2
	var picked2 = $("<h5>");
	picked2.attr("id", "choice");
	picked2.html(p2.choice);
	$("#player2").prepend(picked2)


	//figures out who is the winner and loser
	if(p1.choice === "rock"){
		if(p2.choice === "paper"){
			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(1, snapshot.val().losses+1);
			});

			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/wins").set(snapshot.val().wins+1);
				updateWins(2, snapshot.val().wins+1, p2.name);
			});
		}
		else if(p2.choice === "scissor"){
			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(2, snapshot.val().losses+1);
			});

			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/wins").set(snapshot.val().wins+1);
				updateWins(1, snapshot.val().wins+1, p1.name);
			});
		}
		//tie
		else{
			$("#results").html('<div class="col my-auto"><div class="row justify-content-center"><h3>TIE!</h3></div></div>');
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
				updateWins(2, snapshot.val().wins+1, p2.name);
			});
		}
		else if(p2.choice === "rock"){
			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(2, snapshot.val().losses+1);
			});

			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/wins").set(snapshot.val().wins+1);
				updateWins(1, snapshot.val().wins+1, p1.name);
			});
		}
		//tie
		else{
			$("#results").html('<div class="col my-auto"><div class="row justify-content-center"><h3>TIE!</h3></div></div>');
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
				updateWins(2, snapshot.val().wins+1, p2.name);
			});
		}
		else
			if(p2.choice === "paper"){
			database.ref("/users/"+p2.key).once("value", function(snapshot){
				database.ref("/users/"+p2.key+"/losses").set(snapshot.val().losses+1);
				updateLosses(2, snapshot.val().losses+1);
			});

			database.ref("/users/"+p1.key).once("value", function(snapshot){
				database.ref("/users/"+p1.key+"/wins").set(snapshot.val().wins+1);
				updateWins(1, snapshot.val().wins+1, p1.name);
			});
		}
		//tie
		else{
			$("#results").html('<div class="col my-auto"><div class="row justify-content-center"><h3>TIE!</h3></div></div>');
		}
	}//player 1 chose scissor

	//clears the selected choice
	database.ref("/users/"+p1.key+"/choice").set("");
	database.ref("/users/"+p2.key+"/choice").set("");

	//sets the timer to let results stay for a bit
	waitForNextRound = setTimeout(function(){
			database.ref("turn").set(1);
			displayCurrentPlayer();
		},
		4000);
}

//update the html with the new win totals
function updateWins(player, total, name){
	$("#player"+player+" #wins #win-totals").html(total);

	//shows the winner in the results
	$("#results").html('<div class="col my-auto"><div class="row justify-content-center"><h3>'+name+'</h3></div><div class="row justify-content-center"><h3>WINS!</h3></div></div>');
}

//update the html with the new loss totals
function updateLosses(player, total){
	$("#player"+player+" #losses #loss-totals").html(total);
}

//function to submit to the message box
function postMessage(){
	var message = $("#message-input").val().trim();
	var currentTime = new Date();

	//removes the first message if beyond max allowed
	if(messages.length == 25){
		messages.splice(0, 1);
	}
	else if(messages.length > 25){
		messages.splice(0, (messages.length - 24));
	}

	//adds the new message to the array
	messages.push({
		m: userName+": "+message,
		time: currentTime.getTime()});

	//overites the message array with the new one
	database.ref("/message").set({messages});

	//clears the input box
	$("#message-input").val("");
}