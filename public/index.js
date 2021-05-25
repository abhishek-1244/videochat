var socket = io();

var video = document.getElementById("localvideo");
var peerVideo = document.getElementById("remotevideo");
var roomname;
var creator = false;
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
  creator = true;
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
  creator = false;
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
});

socket.on('full', function() {
  alert("room full can't join!!")
});

socket.on('ready', function() {
  if(creator){
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
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
  if(!creator){
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
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




function OnIceCandidateFunction(event){
  if(event.candidate){
    socket.emit('candiate', event.candidate, roomname);
  }
}


function OnTrackFunction(event){
  peerVideo.srcObject = event.streams[0];
  peerVideo.onloadedmetadata = function(e) {
  peerVideo.play();
  };
}
