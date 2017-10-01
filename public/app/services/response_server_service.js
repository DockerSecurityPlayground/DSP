var dsp_server_response= function(Notification) {
  this.manage = function(promise, callbackSuccess, callbackError) {
    promise
            .then(
            function success(response) {
                Notification({message:"Success!"}, 'success');
                if(callbackSuccess && typeof callbackSuccess === 'function') 
                {
    
                        callbackSuccess(response);
                }
            },
            function error(response) {
                    console.log(response);
                    Notification('Server error:'+ response.data.message, 'error');
                    if(callbackError && typeof callbackError === 'function') 
                    {
        
                            callbackSuccess(response);
                    }
            });
  }
}


