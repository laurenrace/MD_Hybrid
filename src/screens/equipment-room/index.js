import { io } from "socket.io-client";
import { SimpleMediasoupPeer } from "simple-mediasoup-peer-client";
var request = require('request');

let socket;
let mediasoupPeer;
let localCam;

let cameraPaused = false;
let micPaused = false;

let hasInitializedCameraAccess = false;

let peers = {};

const cameraPausedButton = document.getElementById("toggleCameraPausedButton");
const microphonePausedButton = document.getElementById(
  "toggleMicrophonePausedButton"
);

window.onload = init;

function init() {
  console.log("~~~~~~~~~~~~~~~~~");

  // for production
  socket = io('https://yorb.itp.io/', {path: '/hybrid/socket.io'});

  // for local development
  // socket = io('http://localhost:65156/');


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
    document.getElementById(id + "_video").remove();
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
      el.className = "peerVideo"
      el.id = id + "_video";
      el.autoplay = true;
      el.muted = true;
      el.setAttribute("playsinline", true);

      // el.style = "visibility: hidden;";      
      document.getElementById("peersVideos").appendChild(el);
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

  mediasoupPeer.addTrack(videoTrack, "video");
  mediasoupPeer.addTrack(audioTrack, "audio");

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

  const audioSource = audioInputSelect.value;
  const videoSource = videoInputSelect.value;
  const constraints = {
    audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    video: {
      deviceId: videoSource ? { exact: videoSource } : undefined,
      width: { ideal: 320 },
      height: { ideal: 240 },
    },
  };
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .then(gotDevices)
    .catch(handleError);
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
// speech recognition & transcription

var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

var recognition = new SpeechRecognition();
let started = false;
recognition.continuous = true;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let transcriptElement = document.getElementById("transcript");

window.onbeforeunload = function () {
  recognition.stop();
  console.log("stop recording");
  return undefined;
};

document.body.onclick = function () {
  if (started) return;
  started = true;
  recognition.start();
  console.log("start recording");
}

recognition.onresult = function (event) {
  res = event.results[event.results.length - 1];
  console.log(res[0].confidence, res[0].transcript);
  transcriptElement.textContent = ": " + res[0].transcript;
}


recognition.onnomatch = function (event) {
  transcriptElement.textContent = "I didn't recognise.";
}

recognition.onerror = function (event) {
  transcriptElement.textContent = 'Error occurred in recognition: ' + event.error;
}

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
// ask for help, doorbell, knock desk
const doorbellSound = document.getElementById("doorbellSound");
const doorbellButton = document.getElementById("doorbellButton");
const knockButton = document.getElementById("knockButton");
doorbellButton.addEventListener("click", () => {
  doorbellSound.play();
});

knockButton.addEventListener("click", () => {
  request.post(
    'http://localhost:65156/motor',
    {},
    function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body);
      }
    }
  );

})

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
// chat box
const chatContent = document.getElementById("chatContent");
const chatHistory = document.getElementById("chatHistory");
const chatSend = document.getElementById("chatSend");
chatSend.addEventListener("click", () => {
  chatHistory.innerHTML = ": " + chatContent.value;
});