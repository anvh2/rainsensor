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

//giải nén chuỗi JSON thành các OBJECT
function ParseJson(jsondata) {
  try {
    return JSON.parse(jsondata);
  } catch (error) {
    return null;
  }
}

//Bắt các sự kiện khi esp8266 kết nối
esp8266_nsp.on("connection", function(socket) {
  console.log("esp8266 connected");

  socket.on("disconnect", function() {
    console.log("Disconnect socket esp8266");
  });

  //nhận được bất cứ lệnh nào
  socket.on("*", function(packet) {
    console.log("esp8266 rev and send to webapp packet: ", packet.data); //in ra để debug
    var eventName = packet.data[0];
    var eventJson = packet.data[1] || {}; //nếu gửi thêm json thì lấy json từ lệnh gửi, không thì gửi chuỗi json rỗng, {}
    webapp_nsp.emit(eventName, eventJson); //gửi toàn bộ lệnh + json đến webapp
  });
});

//Bắt các sự kiện khi webapp kết nối

webapp_nsp.on("connection", function(socket) {
  console.log("webapp connected");

  //Khi webapp socket bị mất kết nối
  socket.on("disconnect", function() {
    console.log("Disconnect socket webapp");
  });

  socket.on("*", function(packet) {
    console.log("webapp rev and send to esp8266 packet: ", packet.data); //in ra để debug
    var eventName = packet.data[0];
    var eventJson = packet.data[1] || {}; //nếu gửi thêm json thì lấy json từ lệnh gửi, không thì gửi chuỗi json rỗng, {}
    esp8266_nsp.emit(eventName, eventJson); //gửi toàn bộ lệnh + json đến esp8266
  });
});
