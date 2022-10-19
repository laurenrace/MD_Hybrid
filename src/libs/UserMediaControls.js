/*
GetUserMedia requests and UI for camera / mic selection

*/
// let localCam;
// let cameraPaused = false;
// let micPaused = false;
// let hasInitializedCameraAccess = false;

// async function startUserMedia() {
//   // request user media before getting device list or the browser may not prompt user for access
//   await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
//   getDevices();
// }

//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//
// user media

// const cameraPausedButton = document.getElementById("toggleCameraPausedButton");
// const microphonePausedButton = document.getElementById(
//   "toggleMicrophonePausedButton"
// );

// const videoElement = document.getElementById("local_video");
// const audioInputSelect = document.querySelector("select#audioSource");
// const audioOutputSelect = document.querySelector("select#audioOutput");
// const videoInputSelect = document.querySelector("select#videoSource");
// const selectors = [audioInputSelect, audioOutputSelect, videoInputSelect];

// audioOutputSelect.disabled = !("sinkId" in HTMLMediaElement.prototype);

// audioInputSelect.addEventListener("change", startStream);
// videoInputSelect.addEventListener("change", startStream);
// audioOutputSelect.addEventListener("change", changeAudioDestination);

// async function getDevices() {
//   let devicesInfo = await navigator.mediaDevices.enumerateDevices();
//   gotDevices(devicesInfo);
//   await startStream();
// }

// function gotDevices(deviceInfos) {
//   // Handles being called several times to update labels. Preserve values.
//   const values = selectors.map((select) => select.value);
//   selectors.forEach((select) => {
//     while (select.firstChild) {
//       select.removeChild(select.firstChild);
//     }
//   });
//   for (let i = 0; i !== deviceInfos.length; ++i) {
//     const deviceInfo = deviceInfos[i];
//     const option = document.createElement("option");
//     option.value = deviceInfo.deviceId;
//     if (deviceInfo.kind === "audioinput") {
//       option.text =
//         deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
//       audioInputSelect.appendChild(option);
//     } else if (deviceInfo.kind === "audiooutput") {
//       option.text =
//         deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
//       audioOutputSelect.appendChild(option);
//     } else if (deviceInfo.kind === "videoinput") {
//       option.text = deviceInfo.label || `camera ${videoInputSelect.length + 1}`;
//       videoInputSelect.appendChild(option);
//     } else {
//       console.log("Some other kind of source/device: ", deviceInfo);
//     }
//   }
//   selectors.forEach((select, selectorIndex) => {
//     if (
//       Array.prototype.slice
//         .call(select.childNodes)
//         .some((n) => n.value === values[selectorIndex])
//     ) {
//       select.value = values[selectorIndex];
//     }
//   });
// }

// function gotStream(stream) {
//   localCam = stream; // make stream available to console

//   cameraPaused = false;
//   micPaused = false;
//   updateCameraPausedButton();
//   updateMicPausedButton();

//   const videoTrack = localCam.getVideoTracks()[0];
//   const audioTrack = localCam.getAudioTracks()[0];

//   let videoStream = new MediaStream([videoTrack]);
//   if ("srcObject" in videoElement) {
//     videoElement.srcObject = videoStream;
//   } else {
//     videoElement.src = window.URL.createObjectURL(videoStream);
//   }

//   videoElement.play();

//   mediasoupPeer.addTrack(videoTrack, "video");
//   mediasoupPeer.addTrack(audioTrack, "audio");

//   // Refresh button list in case labels have become available
//   return navigator.mediaDevices.enumerateDevices();
// }

// function handleError(error) {
//   console.error(
//     "navigator.MediaDevices.getUserMedia error: ",
//     error.message,
//     error.name
//   );
// }

// // Attach audio output device to video element using device/sink ID.
// function attachSinkId(element, sinkId) {
//   if (typeof element.sinkId !== "undefined") {
//     element
//       .setSinkId(sinkId)
//       .then(() => {
//         console.log(`Success, audio output device attached: ${sinkId}`);
//       })
//       .catch((error) => {
//         let errorMessage = error;
//         if (error.name === "SecurityError") {
//           errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
//         }
//         console.error(errorMessage);
//         // Jump back to first output device in the list as it's the default.
//         audioOutputSelect.selectedIndex = 0;
//       });
//   } else {
//     console.warn("Browser does not support output device selection.");
//   }
// }

// function changeAudioDestination() {
//   const audioDestination = audioOutputSelect.value;
//   attachSinkId(videoElement, audioDestination);
// }

// async function startStream() {
//   console.log("getting local stream");
//   if (localCam) {
//     localCam.getTracks().forEach((track) => {
//       track.stop();
//     });
//   }

//   const audioSource = audioInputSelect.value;
//   const videoSource = videoInputSelect.value;
//   const constraints = {
//     audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
//     video: {
//       deviceId: videoSource ? { exact: videoSource } : undefined,
//       width: { ideal: 320 },
//       height: { ideal: 240 },
//     },
//   };
//   navigator.mediaDevices
//     .getUserMedia(constraints)
//     .then(gotStream)
//     .then(gotDevices)
//     .catch(handleError);
// }

// //*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

// function pauseVideo() {
//   if (!localCam) return;
//   localCam.getVideoTracks()[0].enabled = false;
//   cameraPaused = true;
//   updateCameraPausedButton();
// }

// function resumeVideo() {
//   if (!localCam) return;
//   localCam.getVideoTracks()[0].enabled = true;
//   cameraPaused = false;
//   updateCameraPausedButton();
// }

// function pauseMic() {
//   if (!localCam) return;
//   localCam.getAudioTracks()[0].enabled = false;
//   micPaused = true;
//   updateMicPausedButton();
// }

// function resumeMic() {
//   if (!localCam) return;
//   localCam.getAudioTracks()[0].enabled = true;
//   micPaused = false;
//   updateMicPausedButton();
// }

// function updateCameraPausedButton() {
//   if (cameraPaused) {
//     cameraPausedButton.innerText = "CAMERA OFF";
//     cameraPausedButton.classList.remove("buttonActive");
//     cameraPausedButton.classList.add("buttonInactive");
//   } else {
//     cameraPausedButton.innerText = "CAMERA ON";
//     cameraPausedButton.classList.remove("buttonInactive");
//     cameraPausedButton.classList.add("buttonActive");
//   }
// }

// function updateMicPausedButton() {
//   if (micPaused) {
//     microphonePausedButton.innerText = "MIC OFF";
//     microphonePausedButton.classList.remove("buttonActive");
//     microphonePausedButton.classList.add("buttonInactive");
//   } else {
//     microphonePausedButton.innerText = "MIC ON";
//     microphonePausedButton.classList.remove("buttonInactive");
//     microphonePausedButton.classList.add("buttonActive");
//   }
// }

// cameraPausedButton.addEventListener("click", () => {
//   if (cameraPaused) {
//     resumeVideo();
//   } else {
//     pauseVideo();
//   }
// });

// microphonePausedButton.addEventListener("click", () => {
//   if (micPaused) {
//     resumeMic();
//   } else {
//     pauseMic();
//   }
// });

class UserMediaControls {
  constructor() {
    this.localCam;
    this.cameraPaused = false;
    this.micPaused = false;
    this.hasInitializedCameraAccess = false;

    //

    this.cameraPausedButton = document.getElementById(
      "toggleCameraPausedButton"
    );
    this.microphonePausedButton = document.getElementById(
      "toggleMicrophonePausedButton"
    );

    this.cameraPausedButton.addEventListener("click", () => {
      if (this.cameraPaused) {
        this.resumeVideo();
      } else {
        this.pauseVideo();
      }
    });

    this.microphonePausedButton.addEventListener("click", () => {
      if (this.micPaused) {
        this.resumeMic();
      } else {
        this.pauseMic();
      }
    });

    this.videoElement = document.getElementById("local_video");
    this.audioInputSelect = document.querySelector("select#audioSource");
    this.audioOutputSelect = document.querySelector("select#audioOutput");
    this.videoInputSelect = document.querySelector("select#videoSource");
    this.selectors = [
      this.audioInputSelect,
      this.audioOutputSelect,
      this.videoInputSelect,
    ];

    this.audioOutputSelect.disabled = !("sinkId" in HTMLMediaElement.prototype);

    this.audioInputSelect.addEventListener("change", () => this.startStream());
    this.videoInputSelect.addEventListener("change", () => this.startStream());
    this.audioOutputSelect.addEventListener(
      "change",
      this.changeAudioDestination
    );

    this.startUserMedia();
  }

  async startUserMedia() {
    // request user media before getting device list or the browser may not prompt user for access
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    this.getDevices();
    await this.startStream();
  }

  async getDevices() {
    let devicesInfo = await navigator.mediaDevices.enumerateDevices();
    this.gotDevices(devicesInfo);
  }

  gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = this.selectors.map((select) => select.value);
    this.selectors.forEach((select) => {
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
          deviceInfo.label || `microphone ${this.audioInputSelect.length + 1}`;
        this.audioInputSelect.appendChild(option);
      } else if (deviceInfo.kind === "audiooutput") {
        option.text =
          deviceInfo.label || `speaker ${this.audioOutputSelect.length + 1}`;
        this.audioOutputSelect.appendChild(option);
      } else if (deviceInfo.kind === "videoinput") {
        option.text =
          deviceInfo.label || `camera ${this.videoInputSelect.length + 1}`;
        this.videoInputSelect.appendChild(option);
      } else {
        console.log("Some other kind of source/device: ", deviceInfo);
      }
    }
    this.selectors.forEach((select, selectorIndex) => {
      if (
        Array.prototype.slice
          .call(select.childNodes)
          .some((n) => n.value === values[selectorIndex])
      ) {
        select.value = values[selectorIndex];
      }
    });
  }

  gotStream(stream) {
    this.localCam = stream; // make stream available to console

    this.cameraPaused = false;
    this.micPaused = false;
    this.updateCameraPausedButton();
    this.updateMicPausedButton();

    const videoTrack = this.localCam.getVideoTracks()[0];
    const audioTrack = this.localCam.getAudioTracks()[0];

    let videoStream = new MediaStream([videoTrack]);
    if ("srcObject" in this.videoElement) {
      this.videoElement.srcObject = videoStream;
    } else {
      this.videoElement.src = window.URL.createObjectURL(videoStream);
    }

    this.videoElement.play();

    // mediasoupPeer.addTrack(videoTrack, "video");
    // mediasoupPeer.addTrack(audioTrack, "audio");

    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
  }

  handleError(error) {
    console.error(
      "navigator.MediaDevices.getUserMedia error: ",
      error.message,
      error.name
    );
  }

  // Attach audio output device to video element using device/sink ID.
  attachSinkId(element, sinkId) {
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
          this.audioOutputSelect.selectedIndex = 0;
        });
    } else {
      console.warn("Browser does not support output device selection.");
    }
  }

  changeAudioDestination() {
    const audioDestination = this.audioOutputSelect.value;
    this.attachSinkId(this.videoElement, audioDestination);
  }

  async startStream() {
    console.log("getting local stream");
    if (this.localCam) {
      this.localCam.getTracks().forEach((track) => {
        track.stop();
      });
    }

    const audioSource = this.audioInputSelect.value;
    const videoSource = this.videoInputSelect.value;
    const constraints = {
      audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
      video: {
        deviceId: videoSource ? { exact: videoSource } : undefined,
        width: { ideal: 320 },
        height: { ideal: 240 },
      },
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    await this.gotStream(stream);
    await this.getDevices();
  }

  //*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

  pauseVideo() {
    if (!this.localCam) return;
    this.localCam.getVideoTracks()[0].enabled = false;
    this.cameraPaused = true;
    this.updateCameraPausedButton();
  }

  resumeVideo() {
    if (!this.localCam) return;
    this.localCam.getVideoTracks()[0].enabled = true;
    this.cameraPaused = false;
    this.updateCameraPausedButton();
  }

  pauseMic() {
    if (!this.localCam) return;
    this.localCam.getAudioTracks()[0].enabled = false;
    this.micPaused = true;
    this.updateMicPausedButton();
  }

  resumeMic() {
    if (!this.localCam) return;
    this.localCam.getAudioTracks()[0].enabled = true;
    this.micPaused = false;
    this.updateMicPausedButton();
  }

  updateCameraPausedButton() {
    if (this.cameraPaused) {
      this.cameraPausedButton.innerText = "CAMERA OFF";
      this.cameraPausedButton.classList.remove("buttonActive");
      this.cameraPausedButton.classList.add("buttonInactive");
    } else {
      this.cameraPausedButton.innerText = "CAMERA ON";
      this.cameraPausedButton.classList.remove("buttonInactive");
      this.cameraPausedButton.classList.add("buttonActive");
    }
  }

  updateMicPausedButton() {
    if (this.micPaused) {
      this.microphonePausedButton.innerText = "MIC OFF";
      this.microphonePausedButton.classList.remove("buttonActive");
      this.microphonePausedButton.classList.add("buttonInactive");
    } else {
      this.microphonePausedButton.innerText = "MIC ON";
      this.microphonePausedButton.classList.remove("buttonInactive");
      this.microphonePausedButton.classList.add("buttonActive");
    }
  }
}
