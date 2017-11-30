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



var lol = new testCodeCoverage.testCoverageComparison(code, testCases);

//console.log(lol.GUID);
console.log(lol.visitedNodesGUID);
console.log(lol.statementCoverage());
console.log(lol.threadPaths);
console.log(lol.branchCoverage);