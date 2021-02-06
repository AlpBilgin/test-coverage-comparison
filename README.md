# Test Coverage Comparison

Tool for displaying code coverage according to different measures. Accepts a JS function and any combination of input variable values.

## Example

Download repo from [Github](https://github.com/AlpBilgin/test-coverage-comparison) and manually copy the only file and add the only dependency to you project. The the following minimal example should display a statement coverage in percentile.

```JavaScript
var testCodeCoverage = require("./index.js");

var code = `
function code(a, b, c) {
    if(b<c){
      if(a<c){
      }
    }
    return;
}
`;

var testCases = [{a: 1,b: 1,c: 1}]

var tester = new testCodeCoverage.testCoverageComparison(code, testCases);

console.log(tester.statementCoverage());
```

## Limitations

Currently only supports if blocks (no else blocks), logical operators and assigment operators.

Creating local scope variables by copying initial values is allowed. Such that "holder = a;" will cause a holder variable to be internally created.

## TODO

It never occured to me but this is exactly the sort of thing that Bret Victor is good at: http://worrydream.com/LearnableProgramming/

### Analysis targets

- Else blocks
- Increment operator
- While blocks
- Declaration keyword (var, let, const) support
- Algebraic operations (+ - * /) support

### Algorithms

- Parser should be divided into smaller objects to allow finer grained output.

### Testing

- Testing can be made more robust.
