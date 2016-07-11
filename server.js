var express = require('express')
var app = express()
var login = require("facebook-chat-api");
var fs = require("fs");
var Firebase = require("firebase");
var fb = new Firebase("https://trevbot.firebaseio.com");

var request = require('request');
var cheerio = require('cheerio');

app.get('/', function (req, res) {
    res.send('Hello world')
})

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('App listening at http://%s:%s', host, port)
})

function list(event, api) {
    fb.child("" + event.threadID).once("value", function(data) {
        var message = "ACTION ITEMS:\n";
        var count = 1;
        for(var x in data.val())
        {
            message += count + ": " + data.val()[x] + "\n";
            count++;
        }
        if(message == "ACTION ITEMS:\n")
            message = "NO ITEMS ADDED YET";
        api.sendMessage(message, event.threadID);
    });
}

login({email: ---EMAIL---, password: ---PASSWORD---}, function callback (err, api) {
    if(err) return console.error(err);

    api.setOptions({
        listenEvents: true
    });

    var stopListening = api.listen(function(err, event) {
        if(err) return console.error(err);

        switch(event.type) {
            case "message":
                if(event.body != null && event.body.substring(1,0) == "/"){

                    if(event.body.toLowerCase().includes("/add ")) {
                        var item = event.body.substring(5);
                        if(item.length > 0)
                        {
                            fb.child("" + event.threadID).push(item.trim());
                            api.sendMessage("'" + item + "' HAS BEEN ADDED", event.threadID);
                            list(event, api);
                        }
                        else
                        {
                            api.sendMessage("NEED ITEM TO ADD", event.threadID);
                        }
                        
                    } 
                    else if (event.body.toLowerCase().includes("/elo ")) {
                        var name = event.body.substring(5);
                        url = 'https://www.badlion.net/profile/user/' + name;

                        request(url, function(error,response, html) {
                            if(!error) {
                                var $ = cheerio.load(html);

                                var elo;
                                var json = {elo: ""};

                                $('.rate_Table').filter(function() {
                                    var data = $(this);
                                    var table = data.children();
                                    for(var i = 0; i < table.length; i++){
                                       console.log(table.eq(i).children().eq(0).text()); if(table.eq(i).children().eq(0).text().includes("Build ")) {
                                            elo = table.eq(i).children().eq(1).text();
                                        }
                                    }
                                    api.sendMessage(elo, event.threadID);
                                });
                            }
                        });
                    }
                        
                    else if (event.body.toLowerCase().includes("/remove ")) {
                        var item = event.body.substring(8).toLowerCase().trim();
                        if(item.length > 0)
                        {
                            fb.child("" + event.threadID).once("value", function(data) {
                                var message = "'" + item + "' WAS NOT FOUND";  
                                if( item.length < 3)
                                {
                                    var index = parseInt(item);
                                    var count = 1;
                                    for(var x in data.val())
                                    {
                                        if( count == index)
                                        {
                                            fb.child("" + event.threadID).child(x).set(null);
                                            message = "ITEM AT INDEX " + index + " REMOVED";
                                        }
                                        count++;
                                    }
                                }
                                else
                                {
                                    for(var x in data.val())
                                    {
                                        if( item == data.val()[x].toLowerCase() + "")
                                        {
                                            fb.child("" + event.threadID).child(x).set(null);
                                            message = "'" + item + "' REMOVED";
                                        }
                                    }
                                }
                                    
                                api.sendMessage(message, event.threadID);
                            });
                        }
                        else
                        {
                            api.sendMessage("NEED ITEM TO REMOVE", event.threadID);
                        }
                    }
                    
                    else if (event.body.toLowerCase().includes("/edit ")) {
                        var index = parseInt(event.body.substring(6,8).trim());
                        var newItem = event.body.substring(8).trim();
                        fb.child("" + event.threadID).once("value", function(data) {
                            var message = "'" + item + "' WAS NOT FOUND"; 
                            var count = 1;
                            for(var x in data.val())
                            {
                                if( count == index)
                                {
                                    fb.child("" + event.threadID).child(x).set(newItem);
                                    message = "ITEM AT INDEX " + index + " HAS BEEN CHANGED TO " + newItem;
                                }
                                count++;
                            }


                            api.sendMessage(message, event.threadID);
                        });
                        
                    }
                    
                    else if (event.body.toLowerCase().includes("/clear")) {
                        fb.child("" + event.threadID).set(null);
                        api.sendMessage("ALL ITEMS CLEARED", event.threadID);
                    }
                    
                    else if (event.body.toLowerCase().includes("/list")) {
                        list(event,api);                      
                    }

                    else if (event.body.toLowerCase().includes("/chatcolor ")) {
                        var index = event.body.indexOf("#");
                        var color = event.body.substring(index, index+7);
                        api.changeThreadColor(color, event.threadID, function callback(err) {
                            if(err) {
                                api.sendMessage("bruh you got an error", event.threadID);
                                return console.error(err);
                            }
                        });
                    }

                    else if (event.body.toLowerCase().includes("/help")) {
                        var message = "/list - show all current items on the to-do list\n" +
                            "/add (item) - item is added to the end of the to-do list\n" + 
                            "/remove (index) - item at specified index is taken off of the to-do list\n" + 
                            "/edit (index) (new item) - item at specified index is changed to new item\n" +
                            "/clear - all items are taken off of the to-do list";
                        api.sendMessage(message, event.threadID);
                    } 

                   // else if (event.body.includes("#rekt")) {
                   //     var msg = {
                   //         body: "Get rekt bro",
                   //         attachment: fs.createReadStream('rekt.gif')
                   //     }
                   //     api.sendMessage(msg,event.threadID);
                   // }
                    
                }
                api.markAsRead(event.threadID, function(err) {
                    if(err) console.log(err);
                });
                break;
            case "event":
                console.log(event);
                break;
        }
    });
});
