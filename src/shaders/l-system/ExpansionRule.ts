class ExpansionRule {
  outputs: Array<[string, number]> = [];

  addOutput(newString : string, probability : number) {
    this.outputs.push([newString, probability]);
  }

  getOutput() : string {
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
export default ExpansionRule;