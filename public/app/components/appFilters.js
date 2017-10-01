function basenameFilter() {
    return function (item) {
      return item.replace(/^.*[\\\/]/, '');
    }
  };
