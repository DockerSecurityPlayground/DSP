function dsp_cleanerService($location) {

this.parse = function parse(text) {
    text = text.replace(/\{\{hostname\}\}/g, $location.protocol() + "://" + $location.host())
    return text
  }
}
