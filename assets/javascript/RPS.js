$(document).ready(function() {
    var config = {
        apiKey: "AIzaSyBK-MOi5GY5bmYoBfkY--6wKb6DYb-ecR4",
        authDomain: "rps-multiplayer-c905e.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-c905e.firebaseio.com",
        projectId: "rps-multiplayer-c905e",
        storageBucket: "rps-multiplayer-c905e.appspot.com",
        messagingSenderId: "549481676082"
    };

    firebase.initializeApp(config);
    var database = firebase.database();

    var connection=database.ref("/gameUser");
    var connection1=database.ref("/user1");
    var connection2=database.ref("/user2");
    var connectionResult=database.ref("/result");
    var connectionChat=database.ref("/chat");
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");

    var count=5;
    var intervalId;
    var arr=["rock","paper","scissors"];
    var choose;
    var yourID="";
    var string1="";
    var string2="";
    var con;
    var con2;
    var onGame="false";

    /* if game starts */
    function gameStart(){
        $("#waiting").text("Let's Play!!!");
        $("#restart").hide();
        count=5;
        choose="";
        intervalId = setInterval(decrement, 1000);
    }
    
    /* time count */
    function decrement() {
        $("#count").text(count+"seconds left");
        count--;
        if (count<0) {
            clearInterval(intervalId);
            choose=arr[Math.floor(Math.random()*2)];
            setting(choose);
            $("#player1_buttons").hide();
            $("#player2_buttons").hide();
        }
    }

    /* save the select(RPS) of users */
    function setting(choose){
        if(yourID=="1") {
            connection1.set({  
	            yourID: choose
            });
        } else if(yourID=="2") {
            connection2.set({  
	            yourID: choose
            });
        }
    }

    /* if you press button */
    $("button").on("click", function(event) { 
        if($(this).attr("id")=="restart") { /* when it is restart button */
            location.reload();
        } else if($(this).attr("id")=="submit"){ /* when it is chatting button */
            event.preventDefault();
            var conChat=connectionChat.push({
                userID : "player"+yourID,
                content : $("#chatMessage").val()
            });
            $("#chatMessage").val("");
            conChat.onDisconnect().remove();
        }
        else { /* when it is game (RPS) button */
            setting($(this).text());
            $("#count").text("wait...");
            clearInterval(intervalId);
        }
    });

    /* if status of connecting users are changed */
    connectedRef.on("value", function(snapshot) {
        if (snapshot.val()) {
            con = connectionsRef.push(true);
            con.onDisconnect().remove();
        }
    });

    /* if users are connected, then push members into game room (maximum 2 gamer) */
    connectionsRef.on("value", function() {
        if(yourID=="") {
            con2=connection.push(true);
        }
        con2.onDisconnect().remove(); 
    });

    /* if number of gamer  in game room (maximum:2) are changed */
    connection.on("value",function(snapshot){
        if(snapshot.numChildren()==1) { /* if gamer in game room is one (wait for other player) */
            if(yourID=="3") { /* give a chance to new game for waiting member*/
                $("#waiting").html("Quickly press 'Restart' button!!!!");
            } else { /* set player1 */
                yourID="1";
                $("#player1").show();
                $("#player2").hide();
                $("#player1_buttons").show();
                $("#player2_buttons").hide();
                $("#identity_player1").text("player1 : You").css({"color":"blue"});;
                $("#identity_player2").text("player2 : Enemy").css({"color":"red"});;
                $("#waiting").text("Wating the other player.....");
                $("#count").text("");
            }
            onGame="false";
            setting("empty");
        } 
        if(snapshot.numChildren()==2) { /* if game room is full (ready to start) */
            if(yourID=="") {
                yourID="2"; /* set player2 */
                $("#waiting").text("");
                $("#player1_buttons").hide();
                $("#player2_buttons").show();
                setting("empty");
                $("#identity_player1").text("player1 : Enemy").css({"color":"red"});
                $("#identity_player2").text("player2 : You").css({"color":"blue"});;
            } 
            if(yourID=="1" || yourID=="2") {
                if(onGame=="false") {  /* start game */
                    $("#player1").show();
                    $("#player2").show();
                    $("#player1_img").attr("src","assets/images/player1.jpg");
                    $("#player2_img").attr("src","assets/images/player2.jpg");
                    onGame="true";
                    gameStart();
                } 
            }
        }
        if(snapshot.numChildren()>2) { /* game room is already full */
            if(yourID=="") {
                yourID="3"; /* waiting member */
                $("#player1_buttons").hide();
                $("#player2_buttons").hide();
                $("#waiting").html("There are too many people playing game. <br>If you see a message to start, quickly press 'Restart' button");
                $("#count").hide();
                con2.remove(); /* if there are more than 3 connections of gamer, remove connection */ 
            } 
        }
    });

    /* if select of user1 is changed, save the result */
    connection1.on("value", function(snapshot) {
        if(snapshot.child("yourID").exists()) {
            string1=snapshot.val().yourID;
            var result=string1+string2;
            connectionResult.set({  
	            result: result
            });
        }
    });

    /* if select of user2 is changed, save the result */
    connection2.on("value", function(snapshot) {
        if(snapshot.child("yourID").exists()) {
            string2=snapshot.val().yourID;
            var result=string1+string2;
            connectionResult.set({  
	            result: result
            });
        }
    });

    /* check the result of user1 and user2 and show the result */
    connectionResult.on("value", function(snapshot) {
        if(snapshot.child("result").exists()) {
            var result=snapshot.val().result;
            if(result.indexOf("empty")<0) {
                $("#restart").show();
                $("#player1_buttons").hide();
                $("#player2_buttons").hide();
                $("#count").text("player1:"+string1+", player2:"+string2+".")
                if(yourID!="3") {
                    $("#waiting").text("");
                }
                if(result=="rockscissors" || result=="scissorspaper" || result=="paperrock") {
                    $("#count").append("<br>Player1 win!!");
                    $("#player2_img").attr("src","assets/images/player2_defeated.jpg")
                } else if(result=="scissorsrock" || result=="paperscissors" || result=="rockpaper") {
                    $("#count").append("<br>Player2 win!!");
                    $("#player1_img").attr("src","assets/images/player1_defeated.jpg")
                } else {
                    $("#count").append("<br>Draw!!");
                }
            }
        }
    });

    /* if chatting status is changed, show the message */
    connectionChat.on("child_added", function(snapshot) {
        var chatID=snapshot.val().userID;
        if(chatID=="player"+yourID) {
            chatID=chatID+"(YOU)";
        }
        var td=$("<tr>").text(chatID+":"+snapshot.val().content);
        $("table").append(td);
    });

    /* start */
    $("#player1").hide();
    $("#player2").hide();

});