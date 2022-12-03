import { io } from "socket.io-client";
import { SimpleMediasoupPeer } from "simple-mediasoup-peer-client";
import { UserMediaControls } from "../libs/UserMediaControls";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FlakesTexture } from "three/examples/jsm/textures/FlakesTexture.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

let socket;
let mediasoupPeer;
let portalScene;

let peers = {};

window.onload = init;

function init() {
  console.log("~~~~~~~~~~~~~~~~~");

  // socket = io("https://yorb.itp.io", {
  //   path: "/hybrid/socket.io"
  // });

  socket = io(`https://${window.location.hostname}:65156`);


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
  });

  mediasoupPeer = new SimpleMediasoupPeer(socket);
  mediasoupPeer.on("track", gotTrack);

  userMediaControls = new UserMediaControls(mediasoupPeer);

  portalScene = new PortalScene();
}
//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//*//

function gotTrack(track, id, label) {
  console.log(`Got track of kind ${label} from ${id}`);

  let el = document.getElementById(id + "_" + label);

  if (track.kind === "video") {
    if (el == null) {
      console.log("Creating video element for client with ID: " + id);
      el = document.createElement("video");
      el.id = id + "_video";
      el.autoplay = true;
      el.muted = true;
      el.setAttribute("playsinline", true);

      // el.style = "visibility: hidden;";
      document.body.appendChild(el);
      portalScene.addWebcamVideo(el);
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
      el.volume = 0;
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

class PortalScene {
  constructor() {
    this.BACKGROUND_LAYER = 10;
    this.scene = new THREE.Scene();

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.aspect = this.width / this.height;
    console.log("Aspect ratio: ", this.aspect);

    this.portalWidth = 6;
    this.portalHeight = this.portalWidth / this.aspect;

    this.camera = new THREE.PerspectiveCamera(
      50,
      this.width / this.height,
      0.1,
      5000
    );
    this.camera.position.set(0, 0, 5);

    this.mouse = new THREE.Vector2();

    // create an AudioListener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    this.scene.add(this.camera);

    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialiasing: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(new THREE.Color(0x000000), 1); // change sky color
    this.renderer.setSize(this.width, this.height);

    // orbit controls for testing
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // controls.maxAzimuthAngle = (Math.PI / 2) * 0.75;
    // controls.minAzimuthAngle = (-Math.PI / 2) * 0.75;
    // controls.maxPolarAngle = Math.PI * 0.75;
    // controls.minPolarAngle = Math.PI * 0.25;
    // console.log(controls);

    const domElement = document.getElementById("canvasContainer");
    //Push the canvas to the DOM
    domElement.append(this.renderer.domElement);

    //Setup event listeners for events and handle the states
    window.addEventListener("resize", (e) => this.onWindowResize(e), false);
    window.addEventListener("mousemove", (e) => this.onMouseMove(e), false);

    // Helpers
    this.helperGrid = new THREE.GridHelper(500, 500);
    this.helperGrid.position.y = -this.portalHeight / 2 - 0.01; // offset the grid down to avoid z fighting with floor
    this.scene.add(this.helperGrid);

    // setup GLTF / Draco Loader
    // const dracoURL = new URL("../libs/draco", import.meta.url);
    // const dracoURL = "./draco";
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/js/libs/draco/"
    );
    // dracoLoader.setDecoderConfig({ type: "wasm" });
    console.log(dracoLoader);

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(dracoLoader);

    this.setupCubeCameraForEnvironment();

    this.addEnvironment();
    this.addLights();
    this.addStencil();
    this.addPortalSides();
    this.get360video().then(this.loop());

    // const video = document.getElementById("testVideo");
    // video.play();
    // this.addEquirectangularVideo(video);

    // this.loop();

  }
  async get360video() {
    await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    const devicesInfos = await navigator.mediaDevices.enumerateDevices();
    console.log("devicesInfos", devicesInfos);
    // RICOH THETA S (05ca:2711)
    // FaceTime 高清摄像头（内建） (05ac:8514)
    // const cam = devicesInfos.filter(d => d.kind == "videoinput" && d.label == "RICOH THETA S (05ca:2711)");
    const cam = devicesInfos.filter(d => d.kind == "videoinput" && d.label.includes("FaceTime"));
    console.log("cam", cam);

    const constraints = {
      audio: { deviceId: undefined },
      video: { deviceId: { exact: cam.deviceId } },
    };
    const media = await navigator.mediaDevices.getUserMedia(constraints);
    console.log("media", media);
    const track = media.getVideoTracks()[0];
    const stream = new MediaStream([track]);
    const ele = document.createElement("video");
    ele.srcObject = stream;
    ele.muted = true;
    ele.setAttribute("playsinline", true);
    ele.setAttribute("autoplay", true);

    // const ele = document.getElementById("testVideo");
    ele.play();
    await this.addEquirectangularVideo(ele);
  }

  addWebcamVideo(videoEl) {
    this.addEquirectangularVideo(videoEl);
    return;
    
    console.log('adding webcam video', videoEl);
    const geometry = new THREE.PlaneGeometry(4, 4);
    // invert the geometry on the x-axis so that all of the faces point inward
    // geometry.scale(-1, 1, 1);

    const texture = new THREE.VideoTexture(videoEl);
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(0, 0, 2);
    mesh.layers.set(this.BACKGROUND_LAYER);
    this.scene.add(mesh);
  }

  // setup environment mapping which may be useful or interesting!
  setupCubeCameraForEnvironment() {
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
    this.cubeRenderTarget.texture.type = THREE.HalfFloatType;

    this.cubeCamera = new THREE.CubeCamera(1, 1000, this.cubeRenderTarget);
    this.cubeCamera.layers.set(this.BACKGROUND_LAYER);

    const material = new THREE.MeshStandardMaterial({
      // map: this.cubeRenderTarget.texture,
      color: 0xffffff,
      envMap: this.cubeRenderTarget.texture,
      roughness: 0.01,
      metalness: 0.99,
      side: THREE.DoubleSide
    });

    const sphere = new THREE.Mesh(new THREE.IcosahedronGeometry(5, 8), material);
    this.scene.add(sphere);
  }

  addLights() {
    this.scene.add(new THREE.AmbientLight(new THREE.Color(0xffffff), 0.5));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, -20);
    directionalLight.lookAt(0, 0, 0);
    this.scene.add(directionalLight);
  }

  addEnvironment() {
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshPhongMaterial({ color: "blue" })
    );

    this.scene.add(groundMesh);
    groundMesh.rotateX(-Math.PI / 2);
    groundMesh.position.set(0, -this.portalHeight / 2 - 0.025, 0);

    const modelURL = new URL("../assets/rock.glb", import.meta.url);
    console.log(modelURL);
    this.gltfLoader.load(modelURL.href, (gltf) => {
      this.scene.add(gltf.scene);
      gltf.scene.children[0].material.roughness = 1;
      console.log(gltf.scene.children[0].material);
      gltf.scene.position.set(0, -this.portalHeight / 2, -5);
    });

  }

  addEquirectangularVideo(videoEl) {
    console.log("videoEl", videoEl);
    const geometry = new THREE.SphereGeometry(100, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const texture = new THREE.VideoTexture(videoEl);
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    mesh.layers.set(this.BACKGROUND_LAYER);
  }

  addPortalSides() {
    // const normalMap = new THREE.CanvasTexture(new FlakesTexture());
    // normalMap.wrapS = THREE.RepeatWrapping;
    // normalMap.wrapT = THREE.RepeatWrapping;
    // normalMap.repeat.x = 10;
    // normalMap.repeat.y = 6;
    // normalMap.anisotropy = 16;
    const sharedMaterialProps = {
      // clearcoat: 1.0,
      // clearcoatRoughness: 0.1,
      // metalness: 0.9,
      // roughness: 0.5,
      // normalMap,
      // normalScale: new THREE.Vector2(0.25, 0.25),
    };
    const sideDepth = 1;
    // left
    let geo = new THREE.PlaneGeometry(sideDepth, this.portalHeight);
    let mat = new THREE.MeshPhongMaterial({
      color: 0xff00ff,
      side: THREE.DoubleSide,
      ...sharedMaterialProps,
    });
    let side = new THREE.Mesh(geo, mat);
    side.position.set(-this.portalWidth / 2, 0, -sideDepth / 2);
    side.rotateY(Math.PI / 2);
    this.scene.add(side);
    this.portalLeftMesh = side;

    // right
    geo = new THREE.PlaneGeometry(sideDepth, this.portalHeight);
    mat = new THREE.MeshPhongMaterial({
      color: 0xffeeaa,
      side: THREE.DoubleSide,
      ...sharedMaterialProps,
    });
    side = new THREE.Mesh(geo, mat);
    side.position.set(this.portalWidth / 2, 0, -sideDepth / 2);
    side.rotateY(-Math.PI / 2);
    this.scene.add(side);

    this.portalRightMesh = side;

    // top
    geo = new THREE.PlaneGeometry(this.portalWidth, sideDepth);
    mat = new THREE.MeshPhongMaterial({
      color: 0xbbcc33,
      side: THREE.DoubleSide,
      ...sharedMaterialProps,
    });
    side = new THREE.Mesh(geo, mat);
    side.position.set(0, this.portalHeight / 2, -sideDepth / 2);
    side.rotateX(Math.PI / 2);
    this.scene.add(side);

    this.portalTopMesh = side;

    // bottom
    geo = new THREE.PlaneGeometry(this.portalWidth, sideDepth);
    mat = new THREE.MeshPhongMaterial({
      color: 0xffeeaa,
      side: THREE.DoubleSide,
      ...sharedMaterialProps,
    });
    side = new THREE.Mesh(geo, mat);
    side.position.set(0, -this.portalHeight / 2, -sideDepth / 2);
    side.rotateX(-Math.PI / 2);
    this.scene.add(side);

    this.portalBottomMesh = side;
  }

  addStencil() {
    const geo = new THREE.PlaneGeometry(this.portalWidth, this.portalHeight);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.scene.add(mesh);
    mesh.layers.set(1);
  }

  loop() {

    // controls wander back to center
    this.cubeCamera.update(this.renderer, this.scene);
    this.renderer.render(this.scene, this.camera);
    // this.render();

    window.requestAnimationFrame(() => this.loop());
  }

  render() {
    // stencil buffer setup with thanks to https://github.com/stemkoski/AR-Examples/blob/master/stencil-test.html
    let gl = this.renderer.getContext();

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);

    // do not clear buffers before each render
    this.renderer.autoClear = false;
    // clear buffers now: color, depth, stencil
    this.renderer.clear(true, true, true);

    // goal: write 1s to stencil buffer in position of plane

    // activate only layer 1, which only contains the plane
    this.camera.layers.set(1);

    /*
    glStencilFunc specifies a test to apply to each pixel of the stencil buffer
    glStencilFunc(OP, ref, mask)
    creates the test: (ref & mask) OP (stencil & mask)
    parameters:
      OP: GL_NEVER, GL_ALWAYS, GL_EQUAL, GL_NOTEQUAL, 
          GL_LESS, GL_LEQUAL, GL_GEQUAL, GL_GREATER
      ref: a fixed integer used in the comparison
      mask: a mask applied to both ref and the stencil pixel; use 0xFF to disable 
    */
    // always true (always passes); ref = 1.
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);

    /*
    glStencilOp specifies the action to apply depending on the test results from glStencilFunc
    glStencilOp(sFail, sPass_dFail, sPass_dPassOrDisabled)
    sFail: the test from glStencilFunc failed
    sPass_dFail: the test from glStencilFunc passed, but the depth buffer test failed
    sPass_dPassOrDisabled: the test from glStencilFunc passed, and the depth buffer passed or is disabled
    */
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.stencilMask(0xff);

    // during render, do not modify the color or depth buffers (thus only the stencil buffer will be affected)
    gl.colorMask(false, false, false, false);
    gl.depthMask(false);


    this.renderer.render(this.scene, this.camera);


    // SECOND PASS

    // need to clear the depth buffer, in case of occlusion by other objects
    this.renderer.clear(false, true, false);

    // now modify all the buffers again
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);

    // just draw where stencil buffer = 1
    // fragments are only rendered if they pass both the depth test
    //  *and* the stencil test (as specified by glStencilFunc)
    gl.stencilFunc(gl.EQUAL, 1, 0xff);

    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);

    this.camera.layers.set(0); // layer 0 contains everything but plane


    this.cubeCamera.update(this.renderer, this.scene);
    this.renderer.render(this.scene, this.camera);
  }

  //==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//
  //==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//
  // Event Handlers 🍽

  onWindowResize(e) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);


  }

  onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  }
}



const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2;