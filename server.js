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

  socket.on('join',function(data){
    var room = io.sockets.adapter.rooms;
    var room = room.get(data);

    if(room == undefined){
      socket.join(data);
      socket.emit('created');
    }else if(room.size == 1){
      socket.join(data);
      socket.emit('joined');
    }else{
      socket.emit('full');
    }
  });

  socket.on('ready',function(roomname){
    console.log('ready');
    socket.broadcast.to(roomname).emit('ready');
  });

  socket.on('candidate',function(candidate, roomname){
    console.log('candidate');
    socket.broadcast.to(roomname).emit('candidate', candidate);
  });

  socket.on('offer',function(offer, roomname){
    console.log('offer');
    socket.broadcast.to(roomname).emit('offer', offer);
  });

  socket.on('answer',function(answer, roomname){
    console.log('answer');
    socket.broadcast.to(roomname).emit('answer', answer);
  });
});
