const PORT = 34845;

var http = require("http");
var express = require("express");
var socketio = require("socket.io");
var path = require("path");
var ip = require("ip");
var app = express();
var server = http.Server(app);

var io = socketio(server);

var webapp_nsp = io.of("/webapp");
var esp8266_nsp = io.of("/esp8266");

var middleware = require("socketio-wildcard")();
esp8266_nsp.use(middleware);
webapp_nsp.use(middleware);

server.listen(PORT);
console.log("Server nodejs chay tai dia chi: " + ip.address() + ":" + PORT);

//Cài đặt webapp các fie dữ liệu tĩnh
app.set("views", path.join(__dirname, "webapp"));
app.set("view engine", "hbs");
app.use("/", (req, res, next) => {
  res.render("index");
});

function ParseJson(jsondata) {
  try {
    return JSON.parse(jsondata);
  } catch (error) {
    return null;
  }
}

esp8266_nsp.on("connection", function(socket) {
  console.log("esp8266 connected");

  socket.on("disconnect", function() {
    console.log("Disconnect socket esp8266");
  });

  socket.on("*", function(packet) {
    console.log("esp8266 rev and send to webapp packet: ", packet.data); 
    var eventName = packet.data[0];
    var eventJson = packet.data[1] || {};
    webapp_nsp.emit(eventName, eventJson); 
  });
});

webapp_nsp.on("connection", function(socket) {
  console.log("webapp connected");

  socket.on("disconnect", function() {
    console.log("Disconnect socket webapp");
  });

  socket.on("*", function(packet) {
    console.log("webapp rev and send to esp8266 packet: ", packet.data); 
    var eventName = packet.data[0];
    var eventJson = packet.data[1] || {}; 
    esp8266_nsp.emit(eventName, eventJson); 
  });
});
