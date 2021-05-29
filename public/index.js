window.addEventListener("load", function() {

  let socket = io();
  let divVideoChatLobby = document.getElementById("video-chat-lobby");
  let divVideoChat = document.getElementById("video-chat-room");
  let joinButton = document.getElementById("join");
  let userVideo = document.getElementById("user-video");
  let peerVideo = document.getElementById("peer-video");
  let roomInput = document.getElementById("roomName");
  let buttonsDiv = document.getElementById("buttons-div");
  let mic = document.getElementById("mic");
  let camera = document.getElementById("camera");
  let flipCamera = document.getElementById("flip-camera");
  let endCall = document.getElementById("end-call");

  let micFlag = true;
  let cameraFlag = true;
  let flipCameraFlag = true;
  let roomName;
  let creator = false;
  let rtcPeerConnection;
  let userStream;
  let constraints = {
    audio: true,
    video: {
      facingMode: 'user',
    },
  }

  // Contains the stun server URL we will be using.
  let iceServers = {
    iceServers: [{
        urls: "stun:stun.services.mozilla.com"
      },
      {
        urls: "stun:stun.l.google.com:19302"
      },
    ],
  };


  // event for join button..........

  joinButton.addEventListener("click", function() {
    if (roomInput.value == "") {
      alert("Please enter a room name");
    } else {
      roomName = roomInput.value;
      socket.emit("join", roomName);
    }
  });


  // Triggered when a room is succesfully created.

  socket.on("created", function() {
    creator = true;
    divVideoChat.style = "display:block";

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function(stream) {
        /* use the stream */
        userStream = stream;
        divVideoChatLobby.style = "display:none";
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e) {
          userVideo.play();
        };
      })
      .catch(function(err) {
        /* handle the error */
        alert(err);
      });


    //  on start button switching
    buttonsDiv.classList.add("unhide");
    setTimeout(() => {
      buttonsDiv.classList.remove("unhide");
      buttonsDiv.classList.add("hide");
    }, 5000);
  });

  // Triggered when a room is succesfully joined.

  socket.on("joined", function() {
    creator = false;
    divVideoChat.style = "display:block";

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(function(stream) {
        /* use the stream */
        userStream = stream;
        divVideoChatLobby.style = "display:none";
        userVideo.srcObject = stream;
        userVideo.onloadedmetadata = function(e) {
          userVideo.play();
        };
        socket.emit("ready", roomName);
      })
      .catch(function(err) {
        /* handle the error */
        alert(err);
      });
    //  on start button switching
    buttonsDiv.classList.add("unhide");
    setTimeout(() => {
      buttonsDiv.classList.remove("unhide");
      buttonsDiv.classList.add("hide");
    }, 5000);

  });

  // Triggered when a room is full (meaning has 2 people).

  socket.on("full", function() {
    alert("Room is Full, Can't Join");
  });

  // Triggered when a peer has joined the room and ready to communicate.

  socket.on("ready", function() {
    if (creator) {
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      rtcPeerConnection.ontrack = OnTrackFunction;
      rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
      rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
      rtcPeerConnection
        .createOffer()
        .then((offer) => {
          rtcPeerConnection.setLocalDescription(offer);
          socket.emit("offer", offer, roomName);
        })

        .catch((error) => {
          console.log(error);
        });
    }
  });

  // Triggered on receiving an ice candidate from the peer.

  socket.on("candidate", function(candidate) {
    let icecandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(icecandidate);
  });

  // Triggered on receiving an offer from the person who created the room.

  socket.on("offer", function(offer) {
    if (!creator) {
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      rtcPeerConnection.ontrack = OnTrackFunction;
      rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
      rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
      rtcPeerConnection.setRemoteDescription(offer);
      rtcPeerConnection
        .createAnswer()
        .then((answer) => {
          rtcPeerConnection.setLocalDescription(answer);
          socket.emit("answer", answer, roomName);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  });

  // Triggered on receiving an answer from the person who joined the room.

  socket.on("answer", function(answer) {
    rtcPeerConnection.setRemoteDescription(answer);
  });

  // Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

  function OnIceCandidateFunction(event) {
    console.log("Candidate");
    if (event.candidate) {
      socket.emit("candidate", event.candidate, roomName);
    }
  }

  // Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.

  function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
      peerVideo.play();
    };
  }


  // event for onclick peervideo...............

  peerVideo.addEventListener("click", () => {
    buttonsDiv.classList.add("unhide")
    setTimeout(() => {
      buttonsDiv.classList.remove("unhide");
    }, 15000);
  });

  //  mic event handeler....
  mic.addEventListener("click", function() {
    micFlag = !micFlag;
    if (micFlag) {
      userStream.getTracks()[0].enabled = true;
      mic.style = "background-color : none";
    } else {
      userStream.getTracks()[0].enabled = false;
      mic.style = "background-color : #bbbbbb";
    }
  });

  // camera event handeler
  camera.addEventListener("click", function() {
    cameraFlag = !cameraFlag;
    if (cameraFlag) {
      userStream.getTracks()[1].enabled = true;
      camera.style = "background-color : none";
    } else {
      userStream.getTracks()[1].enabled = false;
      camera.style = "background-color : #bbbbbb";
    }

  });

  // flip-Camera  event handeler
  flipCamera.addEventListener("click", function() {
    flipCameraFlag = !flipCameraFlag;
    if (flipCameraFlag) {
      socket.emit('leave', roomName);
      constraints.video.facingMode = 'user';
      socket.emit("join", roomName);
    } else {
      socket.emit('leave', roomName);
      constraints.video.facingMode = 'environment';
      socket.emit("join", roomName);
    }

  });

  //  call end event handeler.......who clicks end button
  endCall.addEventListener("click", function() {
    socket.emit('leave', roomName);
    buttonsDiv.classList.remove("unhide");
    buttonsDiv.classList.add("hide");
    divVideoChat.style = "display:none";
    divVideoChatLobby.style = "display:flex";

    if (userVideo.srcObject) {
      userVideo.srcObject.getTracks()[0].stop();
      userVideo.srcObject.getTracks()[1].stop();
    }

    if (peerVideo.srcObject) {
      peerVideo.srcObject.getTracks()[0].stop();
      peerVideo.srcObject.getTracks()[1].stop();
    }

    if (rtcPeerConnection) {
      rtcPeerConnection.ontrack = null;
      rtcPeerConnection.onicecandidate = null;
      rtcPeerConnection.close();
      rtcPeerConnection = null;
    }
  });

  //  call end event handeler.......who opposit of call ender
  socket.on('leave', () => {
    if (rtcPeerConnection) {
      rtcPeerConnection.ontrack = null;
      rtcPeerConnection.onicecandidate = null;
      rtcPeerConnection.close();
      rtcPeerConnection = null;
    }

    if (peerVideo.srcObject) {
      peerVideo.srcObject.getTracks()[0].stop();
      peerVideo.srcObject.getTracks()[1].stop();
    }

  })


});
