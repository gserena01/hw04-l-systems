import { mat3, vec3, quat } from "gl-matrix";

// vec3 operations from: https://glmatrix.net/docs/module-vec3.html

class Turtle {
  position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
  orientation: mat3 = mat3.create();
  depth: number = 0;

  getForward: () => vec3;
  getRight: () => vec3;
  getUp: () => vec3;
  moveForward: () => void;
  rotateRightX: () => void;
  rotateLeftX: () => void;
  rotate: (axis: vec3, angle: number) => void;

  constructor(pos: vec3, orient: mat3) {
    this.position = pos;
    this.orientation = orient;
    this.depth = 0;

    this.getForward = () => {
      return vec3.fromValues(
        this.orientation[3],
        this.orientation[4],
        this.orientation[5]
      );
    };

    this.getRight = () => {
      return vec3.fromValues(this.orientation[6], this.orientation[7], this.orientation[8]);
    }
    this.getUp = () => {
      return vec3.fromValues(this.orientation[0], this.orientation[1], this.orientation[2]);
    }

    this.moveForward = () => {
      vec3.add(
        this.position,
        this.position,
        vec3.scale(vec3.create(), this.getForward(), 10.0)
      );
    };

    this.rotate = (axis: vec3, angle: number) => {
      vec3.normalize(axis, axis);
      let radians = (3.14159 * angle) / 180.0;

      let q: quat = quat.create();
      quat.setAxisAngle(q, axis, radians);
      quat.normalize(q, q);

      let m: mat3 = mat3.create();
      mat3.fromQuat(m, q);
      mat3.multiply(this.orientation, m, this.orientation);
    };

    this.rotateRightX = () => {
      this.rotate(this.getUp(), -15);
    }

    this.rotateLeftX = () => {
      this.rotate(this.getUp(), 15);
    }
  }

  reset() {
    this.position = vec3.fromValues(50.0, 50.0, 0.0);
    this.orientation = mat3.identity(this.orientation);
    this.depth = 0;
  }
}

export default Turtle;
