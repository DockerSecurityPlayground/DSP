IncrementNumber : function IncrementNumber() {
  var objects = []
  const create = function() {
    var n = 0
    return {
      newName: function(baseName) {
        var ret;
        if (n == 0)
          ret = baseName
        else ret = baseName + "_" + n
        n++;
        return ret;
      }
    }
  }
  return {
    init() {
      objects = []
    },
    newObj(baseName) {
      var o = _.findWhere(objects, {name: baseName})
      if (!o) {
        objects.push({
          name: baseName,
          obj: create()
        });
      }
    },
    newName(baseName) {
      var o = _.findWhere(objects, {name: baseName});
      if (o) {
        return o.obj.newName(baseName);
      }
    }
  }
}
