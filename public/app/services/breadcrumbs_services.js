function dsp_BreadCrumbs() {

  this.breads ={ array:  [{link:"/labs", name:"DSP"}] }
  //DOCKer Security Projects
  this.breadCrumbs = function(path, arg) {

  //console.log("path received:"+path)
  //console.log('arg:'+arg)
  this.breads ={ array:  [{link:"/labs", name:"DSP"}] }
  //var path = $location.path()
  switch(path) {
    case '/labs' :
    case '/':
    default:
            this.breads.array.push({ name : "labs", link:"/labs"})
    break
    case '/training' :
            this.breads.array.push({ name: "training", link: "/training"})
    break
    case '/hacktools' :
            this.breads.array.push({ name : "hacktools", link:"/hacktools"})
    break
    case '/configuration' :
            this.breads.array.push({ name : "configuration", link:"/configuration"})
    break
    case '/images' :
            this.breads.array.push({ name : "images", link:"/images"})
    break
    case '/repositories' :
            this.breads.array.push({ name : "repositories", link:"/repositories"})
    break
    case '/labels' :
            this.breads.array.push({ name : "labels", link:"/labels"})
    break
    case '/lab/new':
            this.breads.array.push({ name : "New Lab", link:""})
    break
    case '/lab/use':
            this.breads.array.push({ name : "Use "+arg, link:""})
    break
    case '/lab/edit':
            this.breads.array.push({ name: "Edit "+arg, link:""})
    break
    }
  }


}

//}
