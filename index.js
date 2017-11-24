var js2flowchart = require("js2flowchart");

var code = `
function code(a, b, c) {
    if(b<=a){
        holder = a;
        if(c<b){
            holder = b;
        }
        holder = c;
    }
    else{
        holder = b;
    }
    return;
}
`;

var visitedNodes = [];

var a = 1;
var b = 1;
var c = 1;

var branch = 0;
var statement = 0;

function walker(node) {
  statement++;
  if (node.body && node.body !== []) {
    for (index in node.body) {
      walker(node.body[index], index);
    }
  }
}

function tester(node, childnumber) {
  if (!visitedNodes[node.name]) {
    visitedNodes[node.name] = "";
  }
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

// TODO do code coverage checks on the parsed tree
// console.log(tree.body[0].body[0]);

// tester(tree, null);
walker(tree);
// console.log(tree.body[0].body[0]);
console.log(statement);

// console.log(visitedNodes);

// eval("console.log(visitedNodes)")





// TODO do a more suitable visualisation