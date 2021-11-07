import DrawingRule from "./DrawingRule";
import ExpansionRule from "./ExpansionRule";
import Turtle from "./Turtle";
import Mesh from "../geometry/Mesh";
import { readTextFile } from "../globals";
import { vec3, mat4, quat, mat3 } from "gl-matrix";
import OpenGLRenderer from "../rendering/gl/OpenGLRenderer";

class LSystem {
  turtleStack: Array<Turtle> = [];
  turtle: Turtle = new Turtle(vec3.fromValues(50.0, 50.0, 0.0), mat3.create());
  drawingRules: Map<string, DrawingRule> = new Map();
  expansionRules: Map<string, ExpansionRule> = new Map();
  seed: string;
  axioms: Array<string> = [];
  iterations: number = 2;
  // Set up instanced rendering data arrays.
  branchCols1: Array<number> = [];
  branchCols2: Array<number> = [];
  branchCols3: Array<number> = [];
  branchCols4: Array<number> = [];
  branchColorsBO: Array<number> = [];

  branchNum: number = 0;
  leafNum: number = 0;

  // import objs:
  branch: Mesh = new Mesh(
    readTextFile("resources/cylinder.obj"),
    vec3.fromValues(0, 0, 0)
  );

  drawBranch: () => void;
  setSeed: (s: string) => void;
  pushTurtle: () => void;
  popTurtle: () => void;
  populateExpansionRules: () => void;
  populateDrawingRules: () => void;
  putBranch: (scale: vec3) => void;
  createMeshes: () => void;
  drawTree: () => void;
  expandGrammar: () => void;
  makeTree: () => void;

  constructor() {
    this.turtleStack = [];
    this.turtle = new Turtle(vec3.fromValues(50.0, 50.0, 0.0), mat3.create());

    // define functions below to maintain context of "this"

    this.setSeed = (s: string) => {
      this.seed = s;
    };

    this.pushTurtle = () => {
      let newPos : vec3 = vec3.create();
      let newOrient : mat3 = mat3.create();
      let newTurtle: Turtle = new Turtle(
        vec3.copy(newPos, this.turtle.position),
        mat3.copy(newOrient, this.turtle.orientation)
      );
      let newDepth : number = this.turtle.depth;
      newTurtle.depth = newDepth;
      this.turtleStack.push(newTurtle);
      this.turtle.depth += 1;
    };

    this.popTurtle = () => {
      if (this.turtle.depth > 0) {
        let newTurtle: Turtle = this.turtleStack.pop();
        this.turtle.orientation = mat3.copy(mat3.create(), newTurtle.orientation);
        this.turtle.position = vec3.copy(vec3.create(), newTurtle.position);
        this.turtle.depth -= 1;
      }
    };

    this.populateExpansionRules = () => {
      let rule1: ExpansionRule = new ExpansionRule();
      rule1.addOutput("FF-[--FF++FF]+[++FF]", 1.0);
      this.expansionRules.set("F", rule1);

      let rule2: ExpansionRule = new ExpansionRule();
      rule2.addOutput("++[F]", 1.0);
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
      rotateLeftXRule.addOutput(this.turtle.rotateLeftX, 1.0);
      this.drawingRules.set("+", rotateLeftXRule);

      let rotateRightXRule: DrawingRule = new DrawingRule();
      rotateRightXRule.addOutput(this.turtle.rotateRightX, 1.0);
      this.drawingRules.set("-", rotateRightXRule);

      let forwardRule: DrawingRule = new DrawingRule();
      forwardRule.addOutput(this.drawBranch, 1.0);
      this.drawingRules.set("F", forwardRule);

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

      this.branchColorsBO.push(13 / 255);
      this.branchColorsBO.push(91 / 255);
      this.branchColorsBO.push(80 / 255);
      this.branchColorsBO.push(1.0);
      this.branchNum++;
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
          1.5 - this.turtle.depth * 0.05,
          3.5,
          1.5 - this.turtle.depth * 0.05
        )
      );
    };
  }
}

export default LSystem;
