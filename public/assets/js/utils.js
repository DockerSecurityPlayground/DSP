var DSP_Filters = function DSP_Filters() {

	return {
		subnetFilter : function subnetFilter() {
			return function(x) {
				return x.substring(0, x.lastIndexOf('.')+1)


			}




		}



	}



}
