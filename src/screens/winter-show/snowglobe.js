import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { ITPElements } from "./ITPElements";

export class Snowglobe {
  constructor() {
    this.scene = new THREE.Scene();

    this.snowflakes = {};

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.aspect = this.width / this.height;
    console.log("Aspect ratio: ", this.aspect);

    this.textureLoader = new THREE.TextureLoader();

    this.camera = new THREE.PerspectiveCamera(
      40,
      this.width / this.height,
      0.01,
      5000
    );

    this.mouse = new THREE.Vector2();

    // create an AudioListener and add it to the camera
    this.listener = new THREE.AudioListener();
    this.camera.add(this.listener);
    this.scene.add(this.camera);
    this.camera.position.set(0, 0.75, 3);

    this.camera.lookAt(0, 0.85, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialiasing: true,
    });
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(new THREE.Color(0x000000), 1); // change sky color
    this.renderer.setSize(this.width, this.height);

    // orbit controls for testing
    // const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // controls.target.set(0, 0.25, 0);
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

    this.addSnowglobe();

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(dracoLoader);

    this.addEnvironment();
    this.addLights();
    // const video = document.getElementById("testVideo");
    // video.play();
    // this.addEquirectangularVideo(video);
    this.elements = new ITPElements(this.scene);

    this.loop();
  }

  addWebcamVideo(videoEl) {
    console.log("adding webcam video", videoEl);
    const geometry = new THREE.PlaneGeometry(4, 4);
    // invert the geometry on the x-axis so that all of the faces point inward
    // geometry.scale(-1, 1, 1);

    const texture = new THREE.VideoTexture(videoEl);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(0, 0, 2);
    mesh.layers.set(this.BACKGROUND_LAYER);
    this.scene.add(mesh);
  }

  addLights() {
    this.scene.add(new THREE.AmbientLight(new THREE.Color(0xffffff), 0.8));

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, -20);
    directionalLight.lookAt(0, 0, 0);
    this.scene.add(directionalLight);
  }

  addSnowglobe() {
    const woodTex = this.textureLoader.load(
      new URL(
        "../../assets/wood-texture/kitchen_wood_diff_1k.jpg",
        import.meta.url
      )
    );
    woodTex.wrapS = THREE.RepeatWrapping;
    woodTex.wrapT = THREE.RepeatWrapping;
    woodTex.repeat.set(6, 6);

    const glassTex = this.textureLoader.load(
      new URL(
        "../../assets/wood-texture/kitchen_wood_diff_1k.jpg",
        import.meta.url
      )
    );
    glassTex.wrapS = THREE.RepeatWrapping;
    glassTex.wrapT = THREE.RepeatWrapping;
    glassTex.repeat.set(0.5, 0.5);

    const woodNormal = this.textureLoader.load(
      new URL(
        "../../assets/wood-texture/kitchen_wood_nor_gl_1k.jpg",
        import.meta.url
      )
    );
    woodNormal.wrapS = THREE.RepeatWrapping;
    woodNormal.wrapT = THREE.RepeatWrapping;
    woodNormal.repeat.set(6, 6);
    // add table
    const tableGeo = new THREE.BoxGeometry(3, 0.1, 2);
    const tableMat = new THREE.MeshPhysicalMaterial({
      color: 0xababab,
      map: woodTex,
      normalMap: woodNormal,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    this.scene.add(tableMesh);

    // add sphere
    const sphereGeo = new THREE.SphereGeometry(0.5, 36, 36);
    const sphereMat = new THREE.MeshPhysicalMaterial({
      side: THREE.DoubleSide,
      color: 0xffffff,
      transmission: 1,
      thickness: 2,
      thicknessMap: glassTex,
      opacity: 1,
      metalness: 0,
      roughness: 0,
      ior: 1.5,
      thickness: 0.01,
      specularIntensity: 1,
      specularColor: 0xffffff,
      envMapIntensity: 1,
      lightIntensity: 1,
      exposure: 1,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.position.set(0, 0.5, 0);
    this.scene.add(sphereMesh);

    // add base
    const baseGeo = new THREE.CylinderGeometry(0.38, 0.5, 0.2, 36, 2, false);
    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0x343434,
      map: woodTex,
      normalMap: woodNormal,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, 0.1, 0);
    this.scene.add(baseMesh);

    // add snow plane on base
    const snowbaseGeo = new THREE.CircleGeometry(0.38, 32);
    const snowbaseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const snowbaseMesh = new THREE.Mesh(snowbaseGeo, snowbaseMat);
    snowbaseMesh.position.set(0, 0.21, 0);
    snowbaseMesh.rotateX(-Math.PI / 2);
    this.scene.add(snowbaseMesh);
  }

  addEnvironment() {
    const groundMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshPhongMaterial({ color: "blue" })
    );

    this.scene.add(groundMesh);
    groundMesh.rotateX(-Math.PI / 2);
    groundMesh.position.set(0, -this.portalHeight / 2 - 0.025, 0);

    // add background
    const assetURL = new URL(
      "../../assets/snowy_forest_path_01_1k.hdr",
      import.meta.url
    );
    const hdrEquirect = new RGBELoader().load(assetURL, () => {
      console.log("got equi:", hdrEquirect);
      hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;

      this.scene.environment = hdrEquirect;
      //   this.scene.background = hdrEquirect;
    });

    // add background image
    const bgImg = this.textureLoader.load(
      new URL("../../assets/winter.png", import.meta.url)
    );
    const geo = new THREE.PlaneGeometry(10, 6);
    const mat = new THREE.MeshBasicMaterial({ map: bgImg });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, 1.5, -3);

    // mesh.rotateY(Math.PI);
    this.scene.add(mesh);
  }

  addSnowflakeWithVideo(videoEl, id) {
    this.snowflakes[id] = new Snowflake(this.scene, videoEl);
  }

  removeSnowflake(id) {
    if (this.snowflakes[id]) {
      this.snowflakes[id].remove();
      delete this.snowflakes[id];
    }
  }
  addEquirectangularVideo(videoEl) {
    const geometry = new THREE.SphereGeometry(100, 60, 40);
    // invert the geometry on the x-axis so that all of the faces point inward
    geometry.scale(-1, 1, 1);

    const texture = new THREE.VideoTexture(videoEl);
    const material = new THREE.MeshBasicMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    mesh.layers.set(this.BACKGROUND_LAYER);
  }

  loop() {
    this.elements.update();
    for (let id in this.snowflakes) {
      this.snowflakes[id].update();
    }
    // controls wander back to center
    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(() => this.loop());
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

const map = (value, x1, y1, x2, y2) =>
  ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;

class Snowflake {
  constructor(scene, videoEl) {
    this.scene = scene;

    const geometry = new THREE.PlaneGeometry(0.15, 0.15);
    let material;
    if (videoEl) {
      const texture = new THREE.VideoTexture(videoEl);
      material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
    } else {
      material = new THREE.MeshPhongMaterial({ color: white });
    }

    this.rotationSpeed = Math.random() * 0.01;
    this.speed = Math.random(0.5,1) * 0.001;

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(rr(0.25), 0.75, rr(0.25));
    this.scene.add(this.mesh);

    videoEl.addEventListener("ended", (event) => {
      console.log("video ended.  removing snowflake:", event);
    });
  }

  update() {
    // movement
    this.mesh.position.y -= this.speed;
    this.mesh.rotateY(this.rotationSpeed);

    if (this.mesh.position.y < 0.25) {
      this.mesh.position.y = 0.75;
    }
  }

  remove() {
    this.mesh.removeFromParent();
  }
}

function rr(range) {
  return (Math.random() - 0.5) * range * 2;
}
