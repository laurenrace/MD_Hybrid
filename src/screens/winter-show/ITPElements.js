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
    // add snowflakes!
    const flakeCount = 9000;
    const flakeGeometry = new THREE.TetrahedronGeometry(0.015, 2); // radius,detail
    const flakeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    this.snow = new THREE.Group();

    for (let i = 0; i < flakeCount; i++) {
      const flakeMesh = new THREE.Mesh(flakeGeometry, flakeMaterial);
      flakeMesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40
      );
      this.snow.add(flakeMesh);
    }
    this.scene.add(this.snow);

    this.flakeArray = this.snow.children;

    //add tree!
    //tree trunk
    const tree = new THREE.Group();
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x49311c });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    tree.add(trunk);
    //tree leaves
    const leavesGeometry = new THREE.ConeGeometry(1.2, 2, 6);
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x3d5e3a });
    const leavesBottom = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leavesBottom.position.y = 1.2;
    tree.add(leavesBottom);

    const leavesMiddle = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leavesMiddle.position.y = 2;
    leavesMiddle.scale.set(0.8, 0.8, 0.8);
    tree.add(leavesMiddle);

    const leavesTop = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leavesTop.position.y = 2.8;
    leavesTop.scale.set(0.6, 0.6, 0.6);
    tree.add(leavesTop);

    tree.position.y = 0.24;
    tree.position.z = 0;
    tree.scale.set(0.1, 0.1, 0.1);
    this.scene.add(tree);
    let tree1 = tree.clone();
    tree1.scale.set(0.06, 0.06, 0.06);
    tree1.position.x = 0.2;
    this.scene.add(tree1);
    let tree2 = tree.clone();
    tree2.scale.set(0.08, 0.08, 0.08);
    tree2.position.x = -0.08;
    tree2.position.z = 0.1;
    this.scene.add(tree2);

  }

  update() {
    for (let i = 0; i < this.flakeArray.length / 2; i++) {
      this.flakeArray[i].rotation.y += 0.01;
      this.flakeArray[i].rotation.x += 0.02;
      this.flakeArray[i].rotation.z += 0.03;
      this.flakeArray[i].position.y -= 0.01;
      if (this.flakeArray[i].position.y < -4) {
        this.flakeArray[i].position.y += 10;
      }
    }
    for (let i = this.flakeArray.length / 2; i < this.flakeArray.length; i++) {
      this.flakeArray[i].rotation.y -= 0.03;
      this.flakeArray[i].rotation.x -= 0.03;
      this.flakeArray[i].rotation.z -= 0.02;
      this.flakeArray[i].position.y -= 0.008;
      if (this.flakeArray[i].position.y < -4) {
        this.flakeArray[i].position.y += 9.5;
      }

      this.snow.rotation.y -= 0.0000002;
    }
  }
}
