import { io } from "socket.io-client";
import { SimpleMediasoupPeer } from "simple-mediasoup-peer-client";
var request = require("request");

let socket;
let mediasoupPeer;
let localCam;

let cameraPaused = false;
let micPaused = true;


let hasInitializedCameraAccess = false;

let peers = {};

const cameraPausedButton = document.getElementById("toggleCameraPausedButton");
const microphonePausedButton = document.getElementById(
  "toggleMicrophonePausedButton"
);

window.onload = init;

function init() {
  console.log("~~~~~~~~~~~~~~~~~");

  if (process.env.ENVIRONMENT === "dev") {
    // for local development
    // let host = window.location.hostname;
    // socket = io("https://" + host + "/");
    socket = io("https://localhost:3095/", { path: "/socket.io" });
  } else {
    // for production
    socket = io("https://yorb.itp.io/", { path: "/hybrid/socket.io" });
  }

  mediasoupPeer = new SimpleMediasoupPeer(socket);
  mediasoupPeer.on("track", gotTrack);

  socket.on("clients", (ids) => {
    console.log("Got initial clients!");
    for (const id of ids) {
      if (!(id in peers)) {
        console.log("Client conencted: ", id);
        peers[id] = {};
        mediasoupPeer.connectToPeer(id);
      }
    }
  });

  socket.on("clientConnected", (id) => {
    console.log("Client conencted: ", id);
    peers[id] = {};
    mediasoupPeer.connectToPeer(id);
  });

  socket.on("clientDisconnected", (id) => {
    console.log("Client disconencted:", id);
    delete peers[id];
    // document.getElementById(id + "_video").remove();
    document.getElementById(id).remove();
  });

  cameraPausedButton.addEventListener("click", () => {
    if (cameraPaused) {
      resumeVideo();
    } else {
      pauseVideo();
    }
  });

  microphonePausedButton.addEventListener("click", () => {
    if (micPaused) {
      resumeMic();
    } else {
      pauseMic();
    }
  });
  initialize();

}

function updateCameraPausedButton() {
  if (cameraPaused) {
    cameraPausedButton.innerText = "CAMERA OFF";
    cameraPausedButton.classList.remove("buttonActive");
    cameraPausedButton.classList.add("buttonInactive");
  } else {
    cameraPausedButton.innerText = "CAMERA ON";
    cameraPausedButton.classList.remove("buttonInactive");
    cameraPausedButton.classList.add("buttonActive");
  }
}

function updateMicPausedButton() {
  if (micPaused) {
    microphonePausedButton.innerText = "MIC OFF";
    microphonePausedButton.classList.remove("buttonActive");
    microphonePausedButton.classList.add("buttonInactive");
  } else {
    microphonePausedButton.innerText = "MIC ON";
    microphonePausedButton.classList.remove("buttonInactive");
    microphonePausedButton.classList.add("buttonActive");
  }
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

async function initializeCameraAccess() {
  hasInitializedCameraAccess = true;
  // request user media before getting device list or the browser may not prompt user for access
  await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
  getDevices();
}

function initialize() {
  if (!hasInitializedCameraAccess) {
    initializeCameraAccess();
  }
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

function gotTrack(track, id, label) {
  console.log(`Got track of kind ${label} from ${id}`);

  let isBroadcast = label == "video-broadcast" || label == "audio-broadcast";

  let el = document.getElementById(id + "_" + label);

  if (isBroadcast && track.kind === "video") {
    el = document.getElementById("broadcastVideo");
  }
  if (isBroadcast && track.kind === "audio") {
    el = document.getElementById("broadcastAudio");
    el.volume = 1;
  }

  if (track.kind === "video") {
    if (el == null) {
      console.log("Creating video element for client with ID: " + id);
      el = document.createElement("video");
      el.id = id + "_video";
      el.autoplay = true;
      el.muted = true;
      el.setAttribute("playsinline", true);

      const parentEl = document.createElement("div");
      // parentEl.className = "col";
      parentEl.setAttribute("id", id);
      parentEl.setAttribute("style", "border:0px solid #ffffff; position: absolute;");
      parentEl.style.visibility = 'visible';
      parentEl.style.top = (window.innerHeight - 100) * Math.random() + "px";
      parentEl.style.left = (window.innerWidth - 220) * Math.random() + "px";
      parentEl.style.width = 210 + "px";
      parentEl.style.height = 150 + "px";
      // console.log("hhhhh",document.getElementsByTagName("video"));

      parentEl.appendChild(el);

      // document.getElementById("peersVideos").appendChild(parentEl);

      document.body.appendChild(parentEl);
      if (document.body.appendChild(parentEl)) {
        fishAnimation(id);
        dragElement(document.getElementById(id), id);
      }
    }
  }

  if (track.kind === "audio") {
    if (el == null) {
      console.log("Creating audio element for client with ID: " + id);
      el = document.createElement("audio");
      el.id = id + "_" + label;
      document.body.appendChild(el);
      el.setAttribute("playsinline", true);
      el.setAttribute("autoplay", true);
      // el.volume = 100;
    }
  }

  el.srcObject = null;
  el.srcObject = new MediaStream([track]);

  el.onloadedmetadata = (e) => {
    el.play().catch((e) => {
      console.log("Play Error: " + e);
    });
  };
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
// user media

const videoElement = document.getElementById("local_video");
const audioInputSelect = document.querySelector("select#audioSource");
const audioOutputSelect = document.querySelector("select#audioOutput");
const videoInputSelect = document.querySelector("select#videoSource");
const selectors = [audioInputSelect, audioOutputSelect, videoInputSelect];

audioOutputSelect.disabled = !("sinkId" in HTMLMediaElement.prototype);

audioInputSelect.addEventListener("change", startStream);
videoInputSelect.addEventListener("change", startStream);
audioOutputSelect.addEventListener("change", changeAudioDestination);

fishAnimation("myVideoPosition");
dragElement(document.getElementById("myVideoPosition"), "myVideoPosition");



async function getDevices() {
  let devicesInfo = await navigator.mediaDevices.enumerateDevices();
  gotDevices(devicesInfo);
  await startStream();
}

function gotDevices(deviceInfos) {
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === "audioinput") {
      option.text =
        deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === "audiooutput") {
      option.text =
        deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === "videoinput") {
      option.text = deviceInfo.label || `camera ${videoInputSelect.length + 1}`;
      videoInputSelect.appendChild(option);
    } else {
      console.log("Some other kind of source/device: ", deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (
      Array.prototype.slice
        .call(select.childNodes)
        .some((n) => n.value === values[selectorIndex])
    ) {
      select.value = values[selectorIndex];
    }
  });
}

function gotStream(stream) {
  localCam = stream; // make stream available to console
  if(micPaused && localCam.getAudioTracks()[0].enabled) pauseMic();

  // cameraPaused = false;
  // micPaused = false;
  if (cameraPaused) pauseVideo();
  updateCameraPausedButton();
  updateMicPausedButton();

  const videoTrack = localCam.getVideoTracks()[0];
  const audioTrack = localCam.getAudioTracks()[0];

  let videoStream = new MediaStream([videoTrack]);
  if ("srcObject" in videoElement) {
    videoElement.srcObject = videoStream;
  } else {
    videoElement.src = window.URL.createObjectURL(videoStream);
  }
  videoElement.play();


  setTimeout(() => {
    mediasoupPeer.addTrack(videoTrack, "360");
    mediasoupPeer.addTrack(audioTrack, "audio");
  }, 2500); // add delay here because mediasoupPeer takes a few seconds to set up

  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log(
    "navigator.MediaDevices.getUserMedia error: ",
    error.message,
    error.name
  );
}

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== "undefined") {
    element
      .setSinkId(sinkId)
      .then(() => {
        console.log(`Success, audio output device attached: ${sinkId}`);
      })
      .catch((error) => {
        let errorMessage = error;
        if (error.name === "SecurityError") {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
        }
        console.error(errorMessage);
        // Jump back to first output device in the list as it's the default.
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    console.warn("Browser does not support output device selection.");
  }
}

function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(videoElement, audioDestination);
}

async function startStream() {
  console.log("getting local stream");
  if (localCam) {
    localCam.getTracks().forEach((track) => {
      track.stop();
    });
  }

  // if(localCam && localCam.getAudioTracks()[0].enabled && micPaused) 
  

  const audioSource = audioInputSelect.value;
  const videoSource = videoInputSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: {
      deviceId: videoSource ? { exact: videoSource } : undefined,
      // width: { ideal: 1280 },
      // height: { ideal: 720 },
      width: { ideal: 200 },
    },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

var interval;

function fishAnimation(elementId) {
  var parentElElement = document.getElementById(elementId);
  let v = 1;
  let toRight = true;
  interval = setInterval(function () {
    let leftDistance = parseInt(parentElElement.style.left);
    let windowWidth = window.innerWidth;
    if (toRight == true) {
      if (leftDistance < windowWidth - 200) {
        parentElElement.style.left = parentElElement.offsetLeft + v + "px";
      } else toRight = false;
    } else {
      if (leftDistance > 10) {
        parentElElement.style.left = parentElElement.offsetLeft - v + "px";
      } else toRight = true;
    }
  }, 10);
}

function fishCaught(elementId) {
  var parentElElement = document.getElementById(elementId);
  parentElElement.style.transform = 'rotate(-30deg)';
  clearInterval(interval);
}

function fishFree(elementId) {
  var parentElElement = document.getElementById(elementId);
  parentElElement.style.transform = 'rotate(0deg)';
  fishAnimation(elementId);
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

function dragElement(elmnt, elementId) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
    // fish is caught:
    console.log("呜呜呜被抓了想哭");
    fishCaught(elementId);
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
    // fish is free:
    console.log("我免费啦");
    fishFree(elementId);
  }
}


//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

function pauseVideo() {
  if (!localCam) return;
  localCam.getVideoTracks()[0].enabled = false;
  cameraPaused = true;

  updateCameraPausedButton();
}

function resumeVideo() {
  if (!localCam) return;
  localCam.getVideoTracks()[0].enabled = true;
  cameraPaused = false;

  updateCameraPausedButton();
}

function pauseMic() {
  if (!localCam) return;
  localCam.getAudioTracks()[0].enabled = false;
  micPaused = true;

  updateMicPausedButton();
}

function resumeMic() {
  if (!localCam) return;
  localCam.getAudioTracks()[0].enabled = true;
  micPaused = false;

  updateMicPausedButton();
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
