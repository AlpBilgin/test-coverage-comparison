var testCodeCoverage = require("./index.js");

var code = `
function code(a, b, c) {
    if(b<a){
        if(c<b){
        }
    }
    if(b<c){
    }
    return;
}
`;

var testCases = [{
        a: 1,
        b: 1,
        c: 1
    },
    {
        a: 1,
        b: 0,
        c: 1
    }
]

var tester = new testCodeCoverage.testCoverageComparison(code, testCases);

console.log(tester.GUID);
console.log(tester.visitedNodesGUID);
console.log(tester.statementCoverage());
console.log(tester.threadPaths);
console.log(tester.branchCoverage);