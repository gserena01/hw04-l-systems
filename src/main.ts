import { vec3, mat4 } from "gl-matrix";
import * as Stats from "stats-js";
import * as DAT from "dat-gui";
import Square from "./geometry/Square";
import ScreenQuad from "./geometry/ScreenQuad";
import OpenGLRenderer from "./rendering/gl/OpenGLRenderer";
import Camera from "./Camera";
import { setGL } from "./globals";
import ShaderProgram, { Shader } from "./rendering/gl/ShaderProgram";
import Mesh from "./geometry/Mesh";
import LSystem from './l-system/L-System'
import { readTextFile } from "../src/globals";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  iterations: 3,
  angle: 15
};

let square: Square;
let screenQuad: ScreenQuad;
let time: number = 0.0;
let branch: Mesh;
let matrix: mat4 = mat4.create();
let coral : LSystem = new LSystem(4, 15);

// controls: 
let prevIters = 3;
let prevAngle = 15;

function loadScene() {
  coral.makeTree();

  screenQuad = new ScreenQuad();
  screenQuad.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, 'iterations', 1, 5).step(1);
  gui.add(controls, 'angle', 1, 20).step(1);


  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2 not supported!");
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(
    vec3.fromValues(-60, 90, 15),
    vec3.fromValues(50, 100, 0)
  );

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE); // Additive blending

  const instancedShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/instanced-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/instanced-frag.glsl")),
  ]);

  const flat = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/flat-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/flat-frag.glsl")),
  ]);

  // This function will be called every frame
  function tick() {
    if (controls.iterations != prevIters || controls.angle != prevAngle) {
      prevIters = controls.iterations;
      prevAngle = controls.angle;
      coral = new LSystem(controls.iterations, controls.angle);
      coral.makeTree();


    }
    camera.update();
    stats.begin();
    instancedShader.setTime(time);
    flat.setTime(time++);
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    renderer.render(camera, flat, [screenQuad]);
    renderer.render(camera, instancedShader, [
      coral.branch,
      coral.leaf
    ]);
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener(
    "resize",
    function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.setAspectRatio(window.innerWidth / window.innerHeight);
      camera.updateProjectionMatrix();
      flat.setDimensions(window.innerWidth, window.innerHeight);
    },
    false
  );

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();
  flat.setDimensions(window.innerWidth, window.innerHeight);

  // Start the render loop
  tick();
}

main();
