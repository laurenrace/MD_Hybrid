import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

export class ITPElements {
  constructor(scene) {
    console.log("Adding ITP ELements");
    this.scene = scene;

    // ZOE add elements here to the scene (this.scene)

    const geo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const mat = new THREE.MeshPhongMaterial({ color: "red" });
    this.box = new THREE.Mesh(geo, mat);
    this.box.position.set(0, 0.5, 0);
    this.scene.add(this.box);
  }

  update() {
    this.box.rotateX(0.1);
  }
}
