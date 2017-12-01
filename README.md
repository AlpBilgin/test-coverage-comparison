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

Currently only supports if blocks and logical operators.

## TODO

Still WIP

### Analysis targets

- Assignment operator
- Else blocks
- Increment operator
- While blocks

### Algorithms

- Test runner should use the shadow tree pointers.
- Parser should be divided into smaller objects to allow finer grained output.

### Testing

- Needs testing