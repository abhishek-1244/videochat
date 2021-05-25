var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);



http.listen(process.env.PORT || 4000, function(){
  console.log("server is running on port 4000");
})

app.use(express.static('public'));

io.on('connection', function(socket){
  console.log('a user get connected');

  socket.on('join',function(roomName){
    var room = io.sockets.adapter.rooms;
    var room = room.get(roomName);

    if(room == undefined){
      socket.join(roomName);
      socket.emit('created');
    }else if(room.size == 1){
      socket.join(roomName);
      socket.emit('joined');
    }else{
      socket.emit('full');
    }
  });

  socket.on('ready',function(roomName){
    console.log('ready');
    socket.broadcast.to(roomName).emit('ready');
  });

  socket.on('candidate',function(candidate, roomName){
    console.log('candidate');
    socket.broadcast.to(roomName).emit('candidate', candidate);
  });

  socket.on('offer',function(offer, roomName){
    console.log('offer');
    socket.broadcast.to(roomName).emit('offer', offer);
  });

  socket.on('answer',function(answer, roomName){
    console.log('answer');
    socket.broadcast.to(roomName).emit('answer', answer);
  });
});
