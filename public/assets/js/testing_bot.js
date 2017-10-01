	$(function() {

			var $scope = angular.element($("#appController").scope()).get()[0] // Get scope
			$("#addNetwork").click()
			//$(this).delay(500).queue(function() {
			dspTestAddNetwork($scope,"test_one", "192", "168", "1", "1")		
			dspTestAddNetwork($scope,"test_two", "10", "10", "1", "1")		

			})


function dspTestAddNetwork($scope,name, one,two,three,four) {

				//Create network one
				var formNetwork = $("#formnetwork") 
				$scope.n.name=name
				$("#subnet_one").val(one) 
				$("#subnet_two").val(two) 
				$("#subnet_three").val(three) 
				$("#subnet_four").val(four) 
				$("#network_action_plus").click()

		}

