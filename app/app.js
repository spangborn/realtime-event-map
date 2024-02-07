const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const geoip = require('geoip-lite');
const Chance = require('chance');
const logger = require('morgan');

// var express = require('express'),
//     logger = require('morgan'),
//     app = express(),
//     http = require('http'),
//     server = http.createServer(app),
//     io = require('socket.io').listen(server),
//     
//     geoip = require('geoip-lite');

// log requests
app.use(logger('dev'));

// Static webserver
app.use(express.static('./public'));

// Chance
var chance = new Chance();
var run = false;
var ping = 0;

// Create web socket connection.
io.on('connection', (socket) => {
    
    // Tell client we're good to go
    socket.emit('status', { 'status': 'go' });

    // Start listening for the client's start
    socket.on("start events", function() {
        run = true;
        startStreaming(socket);
    });

    socket.on("pong", function (data) {
        ping = 0;
        //console.log("Pong: " + data);
    })

    socket.on("stop events", function () {
        run = false;
    });
});

function startStreaming(socket) {

    // If we haven't heard back from the client lately, stop sending
    if (ping % 10 == 0) {
        socket.emit("ping", chance.word());
    }
    if (ping > 20) {
        console.log("Haven't heard from client in a while. Stopping streaming.");
        run = false;
        ping = 0;
        return;
    }

    // Generate random data (for now)
    var ip = chance.ip();
    var geo = geoip.lookup(ip);
    var eventType = chance.word();


    if (geo) {
        //console.log(geo.toString());
        var event = {
            "ip"    : ip,
            "geo"   : geo["ll"],
            "type"  : eventType
            };


        //console.log("IP: " + ip + " Lat/Long:" + geo["ll"] + " Event Type: " + eventType);
        socket.emit('event', event);
        ping++;
    }

    if (run) setTimeout(function(){startStreaming(socket);},1000);
}

server.listen(process.env.PORT || 3000);
