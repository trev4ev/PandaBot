var login = require("facebook-chat-api");
var Forecast = require("forecast");
var fs = require('fs');
var date = new Date();

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

    api.setOptions({listenEvents: true});

    var stopListening = api.listen(function(err, event) {
        if(err) return console.error(err);

        switch(event.type) {
            case "message":
                if(event.body != null && event.body.length > 4) {
                    
                    if(event.body.includes("/goodbye")) {
                        api.sendMessage("Goodbye", event.threadID);
                        return stopListening();
                    }

                    else if(event.body.includes("/echo")) {
                        api.sendMessage("" + event.body.substring(6), event.threadID);
                        //api.sendMessage("henry is lame",event.threadID);
                    } 

                    else if (event.body.includes("/chatcolor")) {
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