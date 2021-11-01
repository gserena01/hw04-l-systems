import {vec3} from 'gl-matrix';

// vec3 operations from: https://glmatrix.net/docs/module-vec3.html

class Turtle {
  position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
  orientation: vec3 = vec3.fromValues(0.0, 1.0, 0.0);
  depth: number = 0;

  moveForward : () => void;
  rotateRightX : () => void;
  rotateLeftX : () => void;


  constructor(pos: vec3, orient: vec3) {
    this.position = pos;
    this.orientation = orient;
    this.depth = 0;
    
    this.moveForward = () => {
    vec3.add(this.position, this.position, vec3.scale(vec3.create(), this.orientation, 10.0));
  }
  this.rotateRightX = () => {
    vec3.rotateX(this.orientation, this.orientation, vec3.fromValues(0.0, 0.0, 0.0), -0.35);
  }
  this.rotateLeftX = () => {
    vec3.rotateX(this.orientation, this.orientation, vec3.fromValues(0.0, 0.0, 0.0), 0.35);
  }

  }
  // rotate at a random angle

  reset() {
    this.position = vec3.fromValues(0.0, 0.0, 0.0);
    this.orientation = vec3.fromValues(0.0, 1.0, 0.0);
    this.depth = 0;
  }

  

  
  rotateLeftY() {
    vec3.rotateY(this.orientation, this.orientation, vec3.fromValues(0.0, 0.0, 0.0), 0.35);
  }

  rotateLeftZ() {
    vec3.rotateZ(this.orientation, this.orientation, vec3.fromValues(0.0, 0.0, 0.0), 0.35);
  }

  

  rotateRightY() {
    vec3.rotateY(this.orientation, this.orientation, vec3.fromValues(0.0, 0.0, 0.0), -0.35);
  }

  rotateRightZ() {
    vec3.rotateZ(this.orientation, this.orientation, vec3.fromValues(0.0, 0.0, 0.0), -0.35);
  }

};

export default Turtle;