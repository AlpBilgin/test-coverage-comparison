var js2flowchart = require("js2flowchart");

var code = `
function code(a, b, c) {
    if(b<=a){
        if(c<b){
        }
    }
    if(b<c){
    }
    return;
}
`;

// in an implementation with looping this will be used to keep track of the tester
var visitedNodesGUID = [];
// Walker uses this value to assign GUIDs to nodes
var GUID = 0;
// When a builder reaches a RETURN statement, it dumps its internal buffer here
var traveledPaths = [];

// basic test case
var a = 1;
var b = 1;
var c = 1;

/**
 * Walk the nodes recursively. Assign a GUID to every node
 * @param {*} node 
 */
function walker(node) {
  if (!node.GUID) {
    node.GUID = GUID;
    GUID++;
  }
  if (node.body && node.body !== []) {
    for (index in node.body) {
      walker(node.body[index], index);
    }
  }
}

// This function expects input code to be terminated with a RETURN statement. Otherwise it may cause a call stack violation.
function findSuccessor(node) {
  // look for sibling
  let index = node.parent.body.indexOf(node);
  // if item is in array (actually redundant) and is not the last item(a next sibling exists), return next sibling.
  if (index > -1 && index < (node.parent.body.length - 1)) {
    return node.parent.body[index + 1];
  }
  // if there is no sibling recursively call for parent to find an uncle
  return findSuccessor(node.parent)
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
    // initialise an array, will be filled with edge objects
    this.edges = [];
    // if a parent is defined do a shallow copy of the edges
    if (parentBuilder) {
      console.log("called");
      this.edges = parentBuilder.edges.slice(0);
    }
  }
  // process nodes one by one
  walk(node, incomingGUID, logic) {
    //console.log("node guid", node.GUID)
    let incomingEdge = new edge(incomingGUID, node.GUID, logic)
    // console.log("incomingEdge", incomingEdge)
    // try to record globally
    edge.insertToGlobal(incomingEdge);
    //  record locally
    this.edges.push(incomingEdge);
    // if the node is conditional
    if (node.type === "Conditional") {
      // set falseChild pointer to a successor
      node.falseChild = findSuccessor(node);
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
      traveledPaths.push(this.edges);
      return;
    } else {
      // console.log("here");
      //for all other cases look for a successor
      node.trueChild = findSuccessor(node);
    }

    // clone the builder BEFORE the recursive call to copy the INTERIM state
    // TODO What if I simply stored a copy of the path and then reassigned it back to the
    // same object between executions, instead of creating a clone?
    let clone = new builder(this)


    // follow trueChild is set go on
    if (node.trueChild) {
      this.walk(node.trueChild, node.GUID, true);
    }
    // If falsechild is set create a clone to follow falseChild
    if (node.falseChild) {
      //console.log(this);
      clone.walk(node.falseChild, node.GUID, false);
    }

    // console.log("yerel edge", this.edges);
  }
}



function tester(node, childnumber) {
  visitedNodesGUID.push(node.GUID);
  // making first selected child modify the parent if statement lets us centralise the functionality.
  if (!node.parent.selected) {
    node.parent["selected"] = childnumber;
  }

  switch (node.type) {
    case "Conditional":
      if (eval(node.name)) {
        for (index in node.body) {
          if (node.body[index].key === "consequent") {
            tester(node.body[index], index);
          }
        }
      } else {
        for (index in node.body) {
          if (node.body[index].key === "alternate") {
            tester(node.body[index], index);
          }
        }
      }
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
      eval(node.name);
      break;
    default:
      if (node.body && node.body !== []) {
        for (index in node.body) {
          tester(node.body[index], index);
        }
      }
  }
  return;
}

var tree = js2flowchart.convertCodeToFlowTree(code);
var svg = js2flowchart.convertFlowTreeToSvg(tree);

var fs = require("fs");
fs.writeFileSync("test.svg", svg);

// TESTING DUMP

// TODO do code coverage checks on the parsed tree
// console.log(tree.body[0].body[0]);

walker(tree);
//tester(tree, null);


//console.log(visitedNodesGUID);
//console.log(GUID);

new builder().walk(tree.body[0].body[0], tree.body[0].GUID, true);

console.log("global", edge.globalEdges);
// get decimal value of decision coverage to check uniqueness of paths
// for (let i in traveledPaths) {
//   let holder = 0;
//   for (let j in traveledPaths[i]) {
//     holder += traveledPaths[i][j].logic ? Math.pow(2, j) : 0;
//   }
//   traveledPaths[i].sum = holder;
// }
console.log(traveledPaths)

// console.log(tree.body[0].body[0]);

// eval("console.log(visitedNodes)")





// TODO do a more suitable visualisation