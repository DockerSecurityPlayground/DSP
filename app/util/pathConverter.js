const path = require('path');
const _ = require('underscore');
const stateTpl = {
       'opened' : true,
       'selected' : false
}
const rootPathTpl =  {
      "id": ".",
     "parent": "#",
     "text": "root",
     "content": "#",
     "type": "dir",
     'state' : {
       'opened' : true,
       'selected' : true
     }
}


function convertToRelative(p, rootPath) {
  return p.replace(rootPath, './');
}
function isRoot(p) {
  return p === "./";
}

function dirnames(p) {
  let arr = p.split("/");
  let current = "";
  let ret = [];
  arr.forEach((a) => {
    current += a + "/";
    ret.push(current);
  });
  ret.pop();
  return ret;
}

function fix2Slash(d) {
  return d.replace(".//", "./");
}

function makeTreeDir(dir) {
  dir = fix2Slash(dir);
  if (isRoot(dir)) {
    return rootPathTpl;
  } else  return {
    id: (dir.substr(-1) === '/') ? dir.slice(0, -1) : dir,
    parent: path.dirname(dir),
    content: "#",
    type: "dir",
    state: stateTpl,
    text: path.basename(dir)
  }
}

// TBD: detect file type
function makeTreeFile(f, content, isExecutable = false) {
  f = fix2Slash(f);
  return {
    id: f,
    parent: path.dirname(f),
    content: content,
    text: path.basename(f),
    type: "textfile",
    icon: 'jstree-file',
    isExecutable: isExecutable
  }
}

function getTree(data, rootPath) {
  const ret = []
  data.forEach((d) => {
    // Remove root path
    const relPath = convertToRelative(d.file, rootPath);
    // Get all dirnames
    const dirNames = dirnames(relPath);
    // For each dirname generate a tree dir structur and push in aray ret
    dirNames.forEach((dir) => ret.push(makeTreeDir(dir)));
    // Finally push tree file structure for the current file
    ret.push(makeTreeFile(relPath, d.content, d.isExecutable))
  })
  return _.uniq(ret, (r) => {
    return r.id
  });
}
exports.convertToRelative = convertToRelative;
exports.dirnames = dirnames;
exports.getTree = getTree;
exports.makeTreeDir = makeTreeDir;
exports.makeTreeFile = makeTreeFile;
