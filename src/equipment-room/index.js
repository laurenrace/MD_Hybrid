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

  socket = io("https://localhost");

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
      portalScene.addEquirectangularVideo(el);
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
    this.scene = new THREE.Scene();

    this.portalWidth = 5;
    this.portalHeight = 5;

    this.width = window.innerWidth;
    this.height = window.innerHeight;

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

    const domElement = document.getElementById("canvasContainer");
    //Push the canvas to the DOM
    domElement.append(this.renderer.domElement);

    //Setup event listeners for events and handle the states
    window.addEventListener("resize", (e) => this.onWindowResize(e), false);
    window.addEventListener("mousemove", (e) => this.onMouseMove(e), false);

    // Helpers
    this.helperGrid = new THREE.GridHelper(500, 500);
    this.helperGrid.position.y = -2; // offset the grid down to avoid z fighting with floor
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

    this.addEnvironment();
    this.addLights();
    this.addStencil();
    this.addPortalSides();
    const video = document.getElementById("testVideo");
    video.play();
    this.addEquirectangularVideo(video);

    this.loop();
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
      gltf.scene.position.set(0, -this.portalHeight / 2, -5);
    });
  }

  addEquirectangularVideo(videoEl) {
    const geometry = new THREE.SphereGeometry(10, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const texture = new THREE.VideoTexture(videoEl);
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotateY(Math.PI);
    mesh.position.set(0, -this.portalHeight / 2, 0);
    this.scene.add(mesh);
  }

  addPortalSides() {
    const normalMap = new THREE.CanvasTexture(new FlakesTexture());
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.x = 10;
    normalMap.repeat.y = 6;
    normalMap.anisotropy = 16;
    const sharedMaterialProps = {
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      metalness: 0.9,
      roughness: 0.5,
      normalMap,
      normalScale: new THREE.Vector2(0.25, 0.25),
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
    this.render();

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
    this.renderer.render(this.scene, this.camera);
  }

  //==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//
  //==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//==//
  // Event Handlers 🍽

  onWindowResize(e) {
    this.width = window.innerWidth * 0.9;
    this.height = window.innerHeight * 0.7;
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
