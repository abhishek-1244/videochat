var socket = io();

var video = document.getElementById("localvideo");
var remotevideo = document.getElementById("remotevideo");
var roomname;
var creater = false;
var rtcPeerConnection;
var localStreams;
var iceServers = {
  iceServers:[
  {urls: "stun:stun.services.mozilla.com"},
  {urls: "stun:stun2.l.google.com:19302"},
  {urls: "stun:stun3.l.google.com:19302"},
  {urls: "stun:stun4.l.google.com:19302"},
  {urls: "stun:stun1.l.google.com:19302"},
],
};


document.getElementsByTagName("button")[0].addEventListener('click', function() {
  roomname = document.getElementsByTagName('input')[0].value;
  if (roomname == "") {
    alert("Please enter the room name")
  } else {
    socket.emit('join', roomname);

  }
});

socket.on('created', function() {
  creater = true;
  navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function(stream) {
      localStreams = stream;
      video.srcObject = stream;
      video.onloadedmetadata = function(e) {
        video.play();
      };
    })
    .catch(function(err) {
      alert("error: " + err);
    });
});

socket.on('joined', function() {
  creater = false;
  navigator.mediaDevices.getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function(stream) {
      localStreams =stream;
      video.srcObject = stream;
      video.onloadedmetadata = function(e) {
        video.play();
      };
      socket.emit('ready', roomname);
    })
    .catch(function(err) {
      alert("error: " + err);
    });

  socket.emit('ready',roomname);
});

socket.on('full', function() {
  alert("room full can't join!!")
});

socket.on('ready', function() {
  if(creater){
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onicecandidatefunction;
    rtcPeerConnection.ontrack = ontrackfunction;
    rtcPeerConnection.addTrack(localStreams.getTracks()[0], localStreams);
    rtcPeerConnection.addTrack(localStreams.getTracks()[1], localStreams);
    rtcPeerConnection
      .createOffer()
      .then(function(offer){
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomname);
      })

      .catch(function(error){
        console.log(error);
      });
  }
});


socket.on('candidate', function(candidate) {
  var icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});


socket.on('offer', function(offer) {
  if(!creater){
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onicecandidatefunction;
    rtcPeerConnection.ontrack = ontrackfunction;
    rtcPeerConnection.addTrack(localStreams.getTracks()[0], localStreams);
    rtcPeerConnection.addTrack(localStreams.getTracks()[1], localStreams);
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
      .createAnswer()
      .then(function(answer){
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, roomname);
      })
      .catch(function(error){
        console.log(error);
      });
  }
});


socket.on('answer', function(answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});




function onicecandidatefunction(event){
  if(event.candidate){
    socket.emit('candiate', event.candidate, roomname);
  }
}


function ontrackfunction(event){
  remotevideo.srcObject = event.streams[0];
  remotevideo.onloadedmetadata = function(e) {
  remotevideo.play();
  };
}
