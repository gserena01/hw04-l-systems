class DrawingRule {
    outputs: Array<[any, number]> = [];
  
    addOutput(oper : any, probability : number) {
      this.outputs.push([oper, probability]);
    }
  
    getOutput() : any {
      let rand = Math.random();
      let probabilitySum : number = 0.0;
      let i : number = 0;
      while(i < this.outputs.length) {
        probabilitySum += this.outputs[i][1];
        if (rand < probabilitySum) {
          return this.outputs[i][0];
        }
        i++;
      }
      return;
    }
  };

export default DrawingRule;