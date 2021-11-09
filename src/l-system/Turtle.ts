import { mat3, vec3, quat } from "gl-matrix";

// vec3 operations from: https://glmatrix.net/docs/module-vec3.html
const PI = 3.1415926535;

class Turtle {
  position: vec3 = vec3.fromValues(0.0, 0.0, 0.0);
  orientation: mat3 = mat3.create();
  depth: number = 0;
  angle : number = 15;

  getForward: () => vec3;
  getRight: () => vec3;
  getUp: () => vec3;
  moveForward: () => void;
  smallMoveForward: () => void;
  rotateRightX: () => void;
  rotateLeftX: () => void;
  rotatePosY: () => void;
  rotateNegY: () => void;
  rotatePosZ: () => void;
  rotateNegZ: () => void;
  rotateBigRightX: () => void;
  rotateBigLeftX: () => void;
  rotateBigPosY: () => void;
  rotateBigNegY: () => void;
  rotateBigPosZ: () => void;
  rotateBigNegZ: () => void;
  rotate: (axis: vec3, angle: number) => void;

  constructor(a : number, pos: vec3, orient: mat3) {
    this.position = pos;
    this.orientation = orient;
    this.depth = 0;
    this.angle = a;

    this.getForward = () => {
      return vec3.fromValues(
        this.orientation[3],
        this.orientation[4],
        this.orientation[5]
      );
    };

    this.getRight = () => {
      return vec3.fromValues(
        this.orientation[6],
        this.orientation[7],
        this.orientation[8]
      );
    };
    this.getUp = () => {
      return vec3.fromValues(
        this.orientation[0],
        this.orientation[1],
        this.orientation[2]
      );
    };

    this.moveForward = () => {
      vec3.add(
        this.position,
        this.position,
        vec3.scale(vec3.create(), this.getForward(), 10.0)
      );
    };

    this.smallMoveForward = () => {
      vec3.add(
        this.position,
        this.position,
        vec3.scale(vec3.create(), this.getForward(), 5.0)
      );
    };

    this.rotate = (axis: vec3, angle: number) => {
      // pick random #
      let rand = Math.random();
      // scale it to between -PI/2 and PI/2
      rand = (rand * PI) - (PI / 2);
      // sample it on the sin curve
      let offset = Math.sin(2.0 * rand);
      // multiply value by 10
      offset = offset * 10.0;

      vec3.normalize(axis, axis);
      let radians = (PI * (angle + offset)) / 180.0;

      let q: quat = quat.create();
      quat.setAxisAngle(q, axis, radians);
      quat.normalize(q, q);

      let m: mat3 = mat3.create();
      mat3.fromQuat(m, q);
      mat3.multiply(this.orientation, m, this.orientation);
    };

    this.rotateRightX = () => {
      this.rotate(this.getUp(), -this.angle);
    };

    this.rotateLeftX = () => {
      this.rotate(this.getUp(), this.angle);
    };

    this.rotatePosY = () => {
      this.rotate(this.getForward(), this.angle);
    };

    this.rotateNegY = () => {
      this.rotate(this.getForward(), -this.angle);
    };

    this.rotatePosZ = () => {
      this.rotate(this.getRight(), this.angle);
    };

    this.rotateNegZ = () => {
      this.rotate(this.getRight(), -this.angle);
    };
    this.rotateBigRightX = () => {
      this.rotate(this.getUp(), -this.angle * 2.0);
    };
    
    this.rotateBigLeftX = () => {
      this.rotate(this.getUp(), this.angle * 2.0);
    }

    this.rotateBigPosY = () => {
      this.rotate(this.getForward(), this.angle * 2.0);
    }

    this.rotateBigNegY = () => {
      this.rotate(this.getForward(), -this.angle * 2.0);
    }

    this.rotateBigPosZ = () => {
      this.rotate(this.getRight(), this.angle * 2.0);
    }

    this.rotateBigNegZ = () => {
      this.rotate(this.getRight(), -this.angle * 2.0);
    }
  }

  reset() {
    this.position = vec3.fromValues(50.0, 50.0, 0.0);
    this.orientation = mat3.identity(this.orientation);
    this.depth = 0;
  }
}

export default Turtle;
