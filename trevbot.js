var express = require('express')
var app = express()
var login = require("facebook-chat-api");
var Forecast = require("forecast");
var fs = require("fs");
var date = new Date();
var Firebase = require("firebase");
var fb = new Firebase("https://trevbot.firebaseio.com");

app.get('/', function (req, res) {
    res.send('Hello World!')
})

var server = app.listen(process.env.PORT || 3000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('App listening at http://%s:%s', host, port)
})

var forecast = new Forecast({
    service: 'forecast.io',
    key: 'abb25a8c87bde4cb1f5c44d0084b7ed4',
    units: 'f',
    cache: true, 
    ttl: {             
    minutes: 10,
    seconds: 45
    }
});

login({email: "trevbot23@gmail.com", password: "melrose23"}, function callback (err, api) {
    if(err) return console.error(err);

    api.setOptions({
        listenEvents: true,
        selfListen: true
    });

    var stopListening = api.listen(function(err, event) {
        if(err) return console.error(err);

        switch(event.type) {
            case "message":
                if(event.body != null && event.body.substring(1,0) == "/"){

                    if(event.body.includes("/add ")) {
                        var item = event.body.substring(5);
                        if(item.length > 0)
                        {
                            fb.child("" + event.threadID).push(item.trim());
                            api.sendMessage("'" + item + "' HAS BEEN ADDED", event.threadID);
                        }
                        else
                        {
                            api.sendMessage("NEED ITEM TO ADD", event.threadID);
                        }
                        
                        //api.sendMessage("" + event.body.substring(6), event.threadID);
                        //api.sendMessage("henry is lame",event.threadID);
                    } 
                
                    else if (event.body.includes("/remove ")) {
                        var item = event.body.substring(8).toLowerCase().trim();
                        if(item.length > 0)
                        {
                            fb.child("" + event.threadID).once("value", function(data) {
                                var deleted = false;
                                var message = "'" + item + "' WAS NOT FOUND";   
                                for(var x in data.val())
                                {
                                    if( item == data.val()[x].toLowerCase() + "")
                                    {
                                        fb.child("" + event.threadID).child(x).set(null);
                                        deleted = true;
                                    }
                                }
                                if(deleted)
                                    message = "'" + item + "' REMOVED";
                                api.sendMessage(message, event.threadID);
                            });
                        }
                        else
                        {
                            api.sendMessage("NEED ITEM TO REMOVE", event.threadID);
                        }
                    }
                    
                    else if (event.body.includes("/clear")) {
                        fb.child("" + event.threadID).set(null);
                        api.sendMessage("ALL ITEMS CLEARED", event.threadID);
                    }
                    
                    else if (event.body.includes("/list")) {
                        fb.child("" + event.threadID).once("value", function(data) {
                            var message = "ACTION ITEMS:\n";
                            for(var x in data.val())
                                message += data.val()[x] + "\n";
                            if(message == "ACTION ITEMS:\n")
                                message = "NO ITEMS ADDED YET";
                            api.sendMessage(message, event.threadID);
                        });
                        
                    }

                    else if (event.body.includes("/chatcolor ")) {
                        var index = event.body.indexOf("#");
                        var color = event.body.substring(index, index+7);
                        api.changeThreadColor(color, event.threadID, function callback(err) {
                            if(err) {
                                api.sendMessage("bruh you got an error", event.threadID);
                                return console.error(err);
                            }
                        });
                    } 

                    else if (event.body.includes("#rekt")) {
                        var msg = {
                            body: "Get rekt bro",
                            attachment: fs.createReadStream('rekt.gif')
                        }
                        api.sendMessage(msg,event.threadID);
                    }
                    
                    else if (event.body.includes("/weather")) {
                        forecast.get([37.2986610,-122.0125970], function(err,weather) {
                            if(err) return console.dir(err);
                            var currentHour = date.getHours();
                            if(currentHour > 6)
                                currentHour -= 7;
                            else
                                currentHour += 17;
                            var hour = currentHour;
                            var message = "";
                            var s;
                            for(var i = 0; i < 12; i++)
                            {
                                s = "am"
                                hour = (currentHour + i) % 24;
                                if(hour >= 12)
                                {
                                    hour %= 12;
                                    s = "pm";
                                }
                                if(hour == 0)
                                {
                                    hour = 12;
                                }
                                message += (hour + s  + " \t" + weather.hourly.data[i].temperature + "ºF\n");
                            }
                            api.sendMessage(message, event.threadID);
                        });
                    }
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