var js2flowchart = require("js2flowchart");

class testCoverageComparison {
  constructor(code, testCases) {
    // Code is the function to be analysed using the tool
    this.code = code;
    // Testcases is an array of objects that contain key,value pairs of input parameters
    this.testCases = testCases;
    // Parse the string into a initial tree
    this.tree = js2flowchart.convertCodeToFlowTree(code);
    // Generate a reference SVG from the parsed tree
    this.svg = js2flowchart.convertFlowTreeToSvg(this.tree);
    // Walker uses this value to assign GUIDs to nodes
    this.GUID = 0;
    // This is used to keep track of the nodes visited by tester.
    this.visitedNodesGUID = [];
    // list of all paths taken
    this.threadPaths = [];
    // buffer to construct paths in loop
    this.tempPath = [];
    // 'global' list of touched branches
    this.branchCoverage = [];
    // Assign GUIDs to nodes
    this.walker(this.tree);
    // Set a new set of pointers between nodes and plot the paths between
    // All possible paths are stored in edge.globalEdges
    new builder().walk(this.tree, true);
    // Declare it beforehand
    this.currentTestCase = {};
    // iterate through test cases
    for (let i in testCases) {
      this.tempPath = [];
      // assign a test case to the internal state
      this.currentTestCase = testCases[i];
      // run code with the values we just assigned
      this.tester(this.tree, null);
      // store the individual path taken by this test
      this.threadPaths.push(this.tempPath);
      console.log(">----<")
    }
  }

  /**
   * Walk the nodes recursively. Assigns a GUID to every node
   * @param {*} node 
   */
  walker(node) {
    if (!node.GUID) {
      node.GUID = this.GUID;
      this.GUID++;
    }
    if (node.body && node.body !== []) {
      for (let index in node.body) {
        this.walker(node.body[index], index);
      }
    }
  }

  tester(node, childnumber) {
    // When a node is not visited its value in array will be undefined.
    this.visitedNodesGUID[node.GUID] = true;
    // making first selected child modify the parent if statement lets us centralise the functionality.
    if (!node.parent.selected) {
      node.parent["selected"] = childnumber;
    }
    // logic here could be changed to accomodate t/f pathing of decisions
    switch (node.type) {
      case "Conditional":
        if (this.executor(node.name)) {
          for (let index in node.body) {
            if (node.body[index].key === "consequent") {
              this.addEdgeTotempPath(new edge(node.GUID, node.body[index].GUID, true));
              this.addEdgeTobranchCoverage(new edge(node.GUID, node.body[index].GUID, true));
              this.tester(node.body[index], index);
            }
          }
        }
        /*else {
               for (index in node.body) {
                 if (node.body[index].key === "alternate") {
                   tester(node.body[index], index);
                 }
               }
             }*/
        break;
        /*
          case "Loop":
              while (eval(node.name)) {
                  for (index in node.body) {
                      walker(node.body[index]);
                  }
              }
              break;
              */
      case "UpdateExpression":
      case "AssignmentExpression":
        this.executor(node.name);
        break;
      default:
        if (node.body && node.body !== []) {
          for (let index in node.body) {
            this.addEdgeTotempPath(new edge(node.GUID, node.body[index].GUID));
            this.addEdgeTobranchCoverage(new edge(node.GUID, node.body[index].GUID, true));
            this.tester(node.body[index], index);
          }
        }
    }
    return;
  }

  // takes strings in form of (a > b) and evaluates them
  executor(operation) {
    console.log(operation);
    // remove parens if found
    if (operation.charAt(0) === "(") {
      operation = operation.slice(1, -1);
    }
    // change to an array of two operands and a comparison operator
    let tokens = operation.split(" ");
    let lhs = tokens[0];
    let op = tokens[1];
    let rhs = tokens[2];
    switch (op) {
      case ">":
        return this.currentTestCase[lhs] > this.currentTestCase[rhs];
      case "<":
        return this.currentTestCase[lhs] < this.currentTestCase[rhs];
      case ">=":
        return this.currentTestCase[lhs] >= this.currentTestCase[rhs];
      case "<=":
        return this.currentTestCase[lhs] <= this.currentTestCase[rhs];
      case "===":
        return this.currentTestCase[lhs] === this.currentTestCase[rhs];
      case "!==":
        return this.currentTestCase[lhs] !== this.currentTestCase[rhs];
      case "==":
        return this.currentTestCase[lhs] == this.currentTestCase[rhs];
      case "!=":
        return this.currentTestCase[lhs] != this.currentTestCase[rhs];
      case "=":
        return this.currentTestCase[lhs] = this.currentTestCase[rhs];
    }
  }

  addEdgeTotempPath(edge) {
    for (let key in this.tempPath) {
      // silently return if found
      if (this.tempPath[key].equals(edge)) {
        return;
      }
    }
    this.tempPath.push(edge);
  }

  addEdgeTobranchCoverage(edge) {
    for (let key in this.branchCoverage) {
      // silently return if found
      if (this.branchCoverage[key].equals(edge)) {
        return;
      }
    }
    this.branchCoverage.push(edge);
  }

  // The visitedNodesGUID is filled up by the tester. Visited nodes are represented by true, rest are undefined.
  statementCoverage() {
    if (this.visitedNodesGUID.length === 0) {
      return 0;
    }
    // filter not undefined elements into a anon array and use its length for percentage coverage
    return (
      this.visitedNodesGUID.filter( // filter according to callback
        (value) => {
          return value !== undefined // filter defined
        }
      ).length) / this.visitedNodesGUID.length; // get length and divide by total length
  }


}

// This function expects input code to be terminated with a RETURN statement. Otherwise it may cause a infinite recursive callback and a call stack violation.
function findLateralSuccessor(node) {
  // look for sibling
  let index = node.parent.body.indexOf(node);
  // if item is in array (actually redundant) and is not the last item(a next sibling exists), return next sibling.
  if (index > -1 && index < (node.parent.body.length - 1)) {
    return node.parent.body[index + 1];
  }
  // if there is no sibling recursively call for parent to find an uncle
  return findLateralSuccessor(node.parent)
}

// used to encapsulate the connection between node pairs.
class edge {
  // These are GUIDs of parent and child type should be number.
  constructor(parentGUID, childGUID, logic) {
    this.parentGUID = parentGUID;
    this.childGUID = childGUID;
    this.logic = logic;
  }
  getParentGUID() {
    return this.parentGUID
  }
  getChildGUID() {
    return this.childGUID
  }
  getLogic() {
    return this.logic
  }
  equals(other) {
    if (this.parentGUID === other.parentGUID &&
      this.childGUID === other.childGUID &&
      this.logic === other.logic) {
      return true;
    }
    return false;
  }
  // Will compare edge to existing global edges.
  // If duplicate is found silently ignores the insert by return.
  // Otherwise will insert.
  static insertToGlobal(newEdge) {
    for (let i in edge.globalEdges) {
      if (edge.globalEdges[i].equals(newEdge)) {
        return;
      }
    }
    edge.globalEdges.push(newEdge);
  }
}
// This is the standart method for declaring c++ style static varibales
edge.globalEdges = [];


/** 
 * 1)Add a new set of pointers to nodes. A compulsory trueChild and an optional falseChild.
 * 
 * ELSE and LOOP blocks are not supported as of now
 * 
 * Default flow:
 * If the node has a non empty body array, trueChild will point to first element.
 * If the node has an empty array or no array, trueChild will point to the next sibling.
 * If there is no next sibling it will point to first existing (nth)uncle.
 * If the statement is RETURN trueChild will be NULL.
 * 
 * 
 * Conditional Block:
 * If the node has "consequent" children, trueChild will point to first child. (Consequent 
 * children are listed first)
 * If there is no consequent children trueChild will point to the next sibling of IF node.
 * If there is no next sibling it will point to first existing (nth)uncle.
 * 
 * falseChild will by default point to a sibling or to first existing (nth)uncle.
 * 
 * 2)Record the paths
 * When a walker sets a pointer to a trueChild, it will add a {parentID,childID} tuple to its 
 * internal list and try to insert into a common list. This will be used for path-edge coverage
 * 
 * When both pointers of an IF node is set builder will copy itself (with state). Builder will follow the 
 * trueChild and copy will follow the falseChild
 */

class builder {
  constructor(parentBuilder) {
    // initialise an array, will be filled with edge objects that builder creates as it leaves a node
    this.edges = [];
    // if a parent is defined do a shallow copy of the edges
    if (parentBuilder) {
      this.edges = parentBuilder.edges.slice(0);
    }
  }
  // process nodes one by one
  walk(node, logic) {
    // console.log("node guid", node.parent)
    // ignore incoming path if there is only one parent pointer and it is circular
    if (node === node.parent[0]) {
      // console.log("caught")
    } else { // Else create edge
      // console.log(node.GUID);
      // console.log(node.parent);
      let incomingEdge = new edge(node.parent.GUID, node.GUID, logic)
      // console.log("incomingEdge", incomingEdge)
      // try to record globally
      edge.insertToGlobal(incomingEdge);
      //  record locally
      this.edges.push(incomingEdge);
    }
    // Turn into switch case statement
    if (node.type === "Conditional") {
      // set falseChild pointer to a successor
      node.falseChild = findLateralSuccessor(node);
      // if the conditional has children
      if (node.body.length !== 0) {
        // set trueChild pointer of node to first child
        node.trueChild = node.body[0]
      } else {
        //if conditional doesn't have children also point trueChild to successor
        node.trueChild = node.falseChild;
      }
    } else if (node.type === "ReturnStatement") {
      // if the node is terminal
      node.trueChild = null;
      // The array of edges collected by the builder are pushed into a master list that collects all possible paths.
      builder.traveledPaths.push(this.edges);
      return;
    } else if (node.type === "Program") {
      node.trueChild = node.body[0];
    } else if (node.type === "Function") {
      node.trueChild = node.body[0];
    } else {
      // console.log("here");
      //for all other cases look for a successor
      node.trueChild = findLateralSuccessor(node);
    }
    // clone the builder BEFORE the recursive call to copy the INTERIM state
    // TODO What if I simply stored a copy of the path and then reassigned it back to the
    // same object between executions, instead of creating a clone?
    let clone = new builder(this)
    // follow trueChild is set go on
    if (node.trueChild) {
      this.walk(node.trueChild, true);
    }
    // If falsechild is set create a clone to follow falseChild
    if (node.falseChild) {
      //console.log(this);
      clone.walk(node.falseChild, false);
    }
    // console.log("yerel edge", this.edges);
  }
}
// When a builder reaches a RETURN statement, it dumps its internal buffer here
builder.traveledPaths = [];

exports.findSuccessor = findLateralSuccessor;
exports.builder = builder;
exports.edge = edge;
exports.testCoverageComparison = testCoverageComparison;