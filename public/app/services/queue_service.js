function dsp_Queue() {
  console.log("Publish Subscribe queue loaded");
  const DSP_LABELS = "DSP_LABELS";

 this.labelsSubscribe = function(handlers) {
   // Various messages
  const messages = {
    "NEW_LABEL" : handlers['new'] ? handlers['new'] : function() {}
  }
  // Subscribe
  PubSub.subscribe(DSP_LABELS, function(msg, data) {
    if (data in messages) {
      messages[data]();
    }
  })
 } 

 this.labelsPublish = function(msg) {
   PubSub.publish(DSP_LABELS, msg);
 }

 this.labelsNewNotify = function() {
   this.labelsPublish("NEW_LABEL")
 }
}

