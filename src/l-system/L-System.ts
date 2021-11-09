import DrawingRule from "./DrawingRule";
import ExpansionRule from "./ExpansionRule";
import Turtle from "./Turtle";
import Mesh from "../geometry/Mesh";
import { readTextFile } from "../globals";
import { vec3, mat4, quat, mat3, vec4 } from "gl-matrix";
import OpenGLRenderer from "../rendering/gl/OpenGLRenderer";

class LSystem {
  turtleStack: Array<Turtle> = [];
  turtle: Turtle = new Turtle(
    15,
    vec3.fromValues(50.0, 50.0, 0.0),
    mat3.create()
  );
  drawingRules: Map<string, DrawingRule> = new Map();
  expansionRules: Map<string, ExpansionRule> = new Map();
  seed: string;
  axioms: Array<string> = [];
  iterations: number = 2;
  defaultAngle = 15;
  scale = 1;
  color1 = vec4.fromValues(255 / 255, 127.0 / 255.0, 80.0 / 255.0, 1.0);
  color2 = vec4.fromValues(57 / 255.0, 217 /255.0, 222 / 255.0, 1.0);

  // Set up instanced rendering data arrays.
  branchCols1: Array<number> = [];
  branchCols2: Array<number> = [];
  branchCols3: Array<number> = [];
  branchCols4: Array<number> = [];
  branchColorsBO: Array<number> = [];
  branchNum: number = 0;

  leafCols1: Array<number> = [];
  leafCols2: Array<number> = [];
  leafCols3: Array<number> = [];
  leafCols4: Array<number> = [];
  leafColorsBO: Array<number> = [];
  leafNum: number = 0;

  // import objs:
  branch: Mesh = new Mesh(
    readTextFile("resources/cylinder.obj"),
    vec3.fromValues(0, 0, 0)
  );

  leaf: Mesh = new Mesh(
    readTextFile("resources/sphere.obj"),
    vec3.fromValues(0, 0, 0)
  );

  drawBranch: () => void;
  setSeed: (s: string) => void;
  pushTurtle: () => void;
  popTurtle: () => void;
  populateExpansionRules: () => void;
  populateDrawingRules: () => void;
  putBranch: (scale: vec3) => void;
  putLeaf: () => void;
  createMeshes: () => void;
  drawTree: () => void;
  expandGrammar: () => void;
  makeTree: () => void;

  constructor(iters: number, angle: number, s: number, col1 : vec4, col2 : vec4) {
    this.turtleStack = [];
    this.turtle = new Turtle(
      angle,
      vec3.fromValues(50.0, 50.0, 0.0),
      mat3.create()
    );
    this.iterations = iters;
    this.defaultAngle = angle;
    this.scale = s;
    this.color1 = col1;
    this.color2 = col2;

    // define functions below to maintain context of "this"

    this.setSeed = (s: string) => {
      this.seed = s;
    };

    this.pushTurtle = () => {
      let newPos: vec3 = vec3.create();
      let newOrient: mat3 = mat3.create();
      let newTurtle: Turtle = new Turtle(
        angle,
        vec3.copy(newPos, this.turtle.position),
        mat3.copy(newOrient, this.turtle.orientation)
      );
      let newDepth: number = this.turtle.depth;
      newTurtle.depth = newDepth;
      this.turtleStack.push(newTurtle);
      this.turtle.depth += 1;
    };

    this.popTurtle = () => {
      if (this.turtle.depth > 0) {
        let newTurtle: Turtle = this.turtleStack.pop();
        this.turtle.orientation = mat3.copy(
          mat3.create(),
          newTurtle.orientation
        );
        this.turtle.position = vec3.copy(vec3.create(), newTurtle.position);
        this.turtle.depth -= 1;
      }
    };

    this.populateExpansionRules = () => {
      let rule1: ExpansionRule = new ExpansionRule();
      rule1.addOutput("FF#-[-/-/FF#+*+*F^F#]+[+/+F/^F#]#", 0.9); // * is the same as \ in houdini here
      rule1.addOutput("[-*^F]#", 0.1);
      this.expansionRules.set("F", rule1);

      let rule2: ExpansionRule = new ExpansionRule();
      rule2.addOutput("++//&&[F]", 0.9);
      rule2.addOutput("--**^^X#", 0.1);
      this.expansionRules.set("X", rule2);
    };

    this.populateDrawingRules = () => {
      let pushRule: DrawingRule = new DrawingRule();
      pushRule.addOutput(this.pushTurtle, 1.0);
      this.drawingRules.set("[", pushRule);

      let popRule: DrawingRule = new DrawingRule();
      popRule.addOutput(this.popTurtle, 1.0);
      this.drawingRules.set("]", popRule);

      let rotateLeftXRule: DrawingRule = new DrawingRule();
      rotateLeftXRule.addOutput(this.turtle.rotateLeftX, 0.9);
      rotateLeftXRule.addOutput(this.turtle.rotateBigLeftX, 0.1);
      this.drawingRules.set("+", rotateLeftXRule);

      let rotateRightXRule: DrawingRule = new DrawingRule();
      rotateRightXRule.addOutput(this.turtle.rotateRightX, 0.9);
      rotateRightXRule.addOutput(this.turtle.rotateBigRightX, 0.1);
      this.drawingRules.set("-", rotateRightXRule);

      let rotatePosYRule: DrawingRule = new DrawingRule();
      rotatePosYRule.addOutput(this.turtle.rotatePosY, 0.9);
      rotatePosYRule.addOutput(this.turtle.rotateBigPosY, 0.1);
      this.drawingRules.set("*", rotatePosYRule);

      let rotateNegYRule: DrawingRule = new DrawingRule();
      rotateNegYRule.addOutput(this.turtle.rotateNegY, 0.9);
      rotateNegYRule.addOutput(this.turtle.rotateBigNegY, 0.1);
      this.drawingRules.set("/", rotateNegYRule);

      let rotatePosZRule: DrawingRule = new DrawingRule();
      rotatePosZRule.addOutput(this.turtle.rotatePosZ, 0.9);
      rotatePosZRule.addOutput(this.turtle.rotateBigPosZ, 0.1);
      this.drawingRules.set("&", rotatePosZRule);

      let rotateNegZRule: DrawingRule = new DrawingRule();
      rotateNegZRule.addOutput(this.turtle.rotateNegZ, 0.9);
      rotateNegZRule.addOutput(this.turtle.rotateBigNegZ, 0.1);
      this.drawingRules.set("^", rotateNegZRule);

      let forwardRule: DrawingRule = new DrawingRule();
      forwardRule.addOutput(this.drawBranch, 1.0);
      this.drawingRules.set("F", forwardRule);

      let leafRule: DrawingRule = new DrawingRule();
      leafRule.addOutput(this.putLeaf, 1.0);
      this.drawingRules.set("#", leafRule);
    };

    this.putBranch = (scale: vec3) => {
      // Calculate transformation
      let transform: mat4 = mat4.create();
      let q: quat = quat.create();
      quat.fromMat3(q, this.turtle.orientation);
      mat4.fromRotationTranslationScale(
        transform,
        q,
        this.turtle.position,
        scale
      );
      for (let i = 0; i < 4; i++) {
        this.branchCols1.push(transform[i]);
        this.branchCols2.push(transform[4 + i]);
        this.branchCols3.push(transform[8 + i]);
        this.branchCols4.push(transform[12 + i]);
      }

      this.branchColorsBO.push(this.color1[0] / 255.0);
      this.branchColorsBO.push(this.color1[1] / 255.0);
      this.branchColorsBO.push(this.color1[2] / 255.0);
      this.branchColorsBO.push(1.0);
      this.branchNum++;
    };

    this.putLeaf = () => {
      this.turtle.smallMoveForward();

      // Calculate transformation
      let transform: mat4 = mat4.create();
      let q: quat = quat.create();
      let s : vec3 = vec3.scale(vec3.create(), vec3.fromValues(6.5, 6.5, 6.5), this.scale);
      quat.fromMat3(q, this.turtle.orientation);
      mat4.fromRotationTranslationScale(
        transform,
        q,
        this.turtle.position,
        s
      );
      for (let i = 0; i < 4; i++) {
        this.leafCols1.push(transform[i]);
        this.leafCols2.push(transform[4 + i]);
        this.leafCols3.push(transform[8 + i]);
        this.leafCols4.push(transform[12 + i]);
      }

      this.leafColorsBO.push(this.color2[0] / 255.0);
      this.leafColorsBO.push(this.color2[1] / 255.0);
      this.leafColorsBO.push(this.color2[2] / 255.0);
      this.leafColorsBO.push(1.0);
      this.leafNum++;
    };

    this.createMeshes = () => {
      this.branch.create();
    };

    this.drawTree = () => {
      // reset everything
      this.turtle.reset();
      this.branchNum = 0;
      this.branchCols1 = [];
      this.branchCols2 = [];
      this.branchCols3 = [];
      this.branchCols4 = [];
      this.branchColorsBO = [];
      this.branch.destroy();
      this.branch.create();

      this.leafNum = 0;
      this.leafCols1 = [];
      this.leafCols2 = [];
      this.leafCols3 = [];
      this.leafCols4 = [];
      this.leafColorsBO = [];
      this.leaf.destroy();
      this.leaf.create();

      // Draw based on grammar
      let count = 0;
      for (let i = 0; i < this.axioms[this.iterations].length; i++) {
        let func = this.drawingRules
          .get(this.axioms[this.iterations].charAt(i))
          .getOutput();
        if (func) {
          func();
          count++;
        }
      }

      let bCol1: Float32Array = new Float32Array(this.branchCols1);
      let bCol2: Float32Array = new Float32Array(this.branchCols2);
      let bCol3: Float32Array = new Float32Array(this.branchCols3);
      let bCol4: Float32Array = new Float32Array(this.branchCols4);
      let bcolors: Float32Array = new Float32Array(this.branchColorsBO);
      this.branch.setInstanceVBOs(bCol1, bCol2, bCol3, bCol4, bcolors);
      this.branch.setNumInstances(this.branchNum);

      let lCol1: Float32Array = new Float32Array(this.leafCols1);
      let lCol2: Float32Array = new Float32Array(this.leafCols2);
      let lCol3: Float32Array = new Float32Array(this.leafCols3);
      let lCol4: Float32Array = new Float32Array(this.leafCols4);
      let lcolors: Float32Array = new Float32Array(this.leafColorsBO);
      this.leaf.setInstanceVBOs(lCol1, lCol2, lCol3, lCol4, lcolors);
      this.leaf.setNumInstances(this.leafNum);
    };

    this.expandGrammar = () => {
      let currExpansion = this.seed;
      // expanding the grammar
      for (let i = 0; i < this.iterations; i++) {
        let expandedString: string = "";
        for (let j = 0; j < currExpansion.length; j++) {
          let currRule = this.expansionRules.get(currExpansion.charAt(j));
          if (currRule) {
            expandedString += currRule.getOutput();
          } else {
            expandedString += currExpansion.charAt(j);
          }
        }
        currExpansion = expandedString;
        this.axioms.push(expandedString);
      }
    };

    this.makeTree = () => {
      this.setSeed("FX");
      this.axioms = [this.seed];

      this.populateExpansionRules();
      this.populateDrawingRules();

      this.expandGrammar();

      this.drawTree();
    };

    this.drawBranch = () => {
      this.turtle.moveForward();
      this.putBranch(
        vec3.fromValues(
          6.5 - this.turtle.depth * 0.85,
          8.0,
          6.5 - this.turtle.depth * 0.85
        )
      );
    };
  }
}

export default LSystem;
