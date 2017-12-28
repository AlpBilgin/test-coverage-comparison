var testCodeCoverage = require("./index.js");

// don't change the test data without modifying the blackbox test results
var code = `
function code(a, b, c) {
    holder = a;
    a=b;
    b=holder;
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
    b: 2,
    c: 1
}]

var tester = new testCodeCoverage.testCoverageComparison(code, testCases);

// console.log(tester.GUID);
// console.log(tester.visitedNodesGUID);
// console.log(tester.statementCoverage());
// console.log("global edge list\n", testCodeCoverage.edge.globalEdges);
// console.log("List of used edges\n", tester.branchCoverage);
// console.log("list of all paths\n", testCodeCoverage.builder.parsedPaths);
// console.log("list of taken paths\n", tester.threadPaths);


// BLACK BOX TESTS

if (tester.statementCoverage() !== 1) {
    throw new Error("Statement coverage is wrong: " + tester.statementCoverage());
}
if (testCodeCoverage.builder.parsedPaths.length !== 6) {
    throw new Error("Number of all paths is wrong: " + testCodeCoverage.builder.parsedPaths.length);
}
// Only 2 are thread
if (tester.threadPaths.length !== 1) {
    throw new Error("Number of tested paths is wrong: " + tester.threadPaths.length);
}
if (testCodeCoverage.edge.globalEdges.length !== 11) {
    throw new Error("Number of all edges is wrong: " + testCodeCoverage.edge.globalEdges.length);
}
// 3->4 True is missing
if (tester.branchCoverage.length !== 8) {
    throw new Error("Number of covered edges is wrong: " + tester.branchCoverage.length);
}

// WHITE BOX TESTS
// cross check if found paths are in the master path list
for (let key in tester.threadPaths) {
    for (let key2 in testCodeCoverage.builder.parsedPaths) {
        // Local scope for readability
        let primary = tester.threadPaths[key];
        let secondary = testCodeCoverage.builder.parsedPaths[key2];
        // if lengths of paths don't match just ignore the entry in master list
        if (primary.length !== secondary.length) {
            continue;
        }
        // Cross check to see if all edges of the crossed paths match
        // !!!ASSUMES THAT ORDER OF EDGES FOLLOW THE SAME RULES!!!
        let counter = 0;
        for (let i = 0; i < primary.length; i++) {
            // Local scope for readability
            let base = primary[i];
            let comp = secondary[i];
            // compare edges
            if (base.equals(comp)) {
                counter++;
            }
        }
        // if all edges match insert new property to path and set to true
        if (counter === primary.length) {
            primary.check = true;
        }
    }
}

for (let key in tester.threadPaths) {
    // if check is not true
    if (!tester.threadPaths[key].check) {
        throw new Error("Test paths are not in master list");
    }
}

// Result
console.log("All OK!")