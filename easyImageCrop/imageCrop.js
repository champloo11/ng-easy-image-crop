app.directive('imageCrop', [function($compile){
	return {
		restrict: 'A',
	    templateUrl: 'image-crop.html',
		scope:{
			aspectRatio:'=?',
			displayWidth: '=?',
			displayHeight: '=?',
			scaledWidth:'=?',
			scaledHeight:'=?',
			scaledTop:'=?',
			scaledLeft:'=?',
			imgLoader: '=?',
			imgSrc:'=',
		},
		transclude:false,
		controller: ['$scope', '$element', '$window' ,function($scope, $element, $window) {

			// Representation of Crop DIV.
			var rectangleLeft;
			var rectangleRight;
			var rectangleTop;
			var rectangleWidth;
			var rectangleHeight;
			var focusedOnCrop = false;
			var ratioValues;
			var offset;



			// DOM For Manipulatable Elements.
			var imageCropSelectorDiv = $window.document.getElementById("imageCropSelector");
			var imageCropSelect;
			var imageTag; // Any interaction with this should verify that the elemented has loaded.

			// Translation
			var draggingRectangle = false;
			var originalDragX = 0;
			var originalDragY = 0;
			var dragCorrectionX = 0;
			var dragCorrectionY = 0;

			// Resizing
			var resizingRectangle = false;
			var startResizeMouseX = 0;
			var startResizeMouseY = 0;
			var currentResizeOrigin = 0;

			// Rectangle 'Creation'
			var originalMouseX = 0;
			var originalMouseY = 0;

			var mouseXRelative = 0;
			var mouseYRelative = 0;

			// Account for possible scrolling.
			var scrollLeft = 0;
			var scrollTop = 0;

			// Optional pass of aspect ratio.
			if($scope.aspectRatio){
				ratioValues = $scope.aspectRatio.split("/");
				var aspectRatioX = ratioValues[0];
				var aspectRatioY = ratioValues[1];
			}

			$scope.$watch("aspectRatio", function(newValue, oldValue){
				if(newValue){
					if(newValue !== oldValue && newValue.split("/").length == 2){
						ratioValues = newValue.split("/");
						if(ratioValues.length == 2){
							aspectRatioX = ratioValues[0];
							aspectRatioY = ratioValues[1];
						}

						horizontalScaling(0,0,0);

						// If we don't perform this check, and we go from false, to true aspectRatio,
						// a "0x0" rectangle will draw, and set the background to black. 
						if(rectangleLeft || rectangleRight || rectangleRight || rectangleHeight){
							drawRectangle();
						}
					}
				}
			});

			// Handle a change in the image we are cropping.
			$scope.$watch("imgSrc", function(newValue, oldValue){
				if(newValue !== oldValue){
					imageCropSelect.style.backgroundImage = newValue;

					// There are a lot of default values that we need to reset.
					$window.document.getElementById("cropToolLoading").style.display= "block";
					rectangleLeft = 0;
					rectangleTop = 0;
					rectangleWidth = 0;
					rectangleHeight = 0;

					$scope.displayHeight = 0;
					$scope.displayWidth = 0;
					$scope.scaledHeight = 0;
					$scope.scaledWidth = 0;
					$scope.scaledLeft = 0;
					$scope.scaledTop =  0;

					$scope.imgSrc = newValue;
					resetBackgroundColor();

					// We need to make sure the image has loaded before we try and get the height.
					$element[0].children[0].onload = function(){
						$window.document.getElementById("cropToolLoading").style.display = "none";

						imageTag = $window.document.getElementById("imageCropSource");
						$scope.currentImageWidth = imageTag.offsetWidth;
						$scope.currentImageHeight = imageTag.offsetHeight;

						// Load the original image again (from the cache), so we can see what the original size is.
						var originalImage = new Image();

						originalImage.onload = function() {
							$scope.originalImageWidth = this.width;
							$scope.originalImageHeight = this.height;

							$scope.scaleFactor = this.width / imageTag.offsetWidth;
						};

						originalImage.src = imageTag.src;
					};
				}
			});

			// We have to load the original image in order to get it
			$scope.originalImageWidth = 0;
			$scope.originalImageHeight = 0;


			// We need to make sure the image has loaded before we try and get the height.
			$element[0].children[0].onload = function(){
				$window.document.getElementById("cropToolLoading").style.display= "none";
				imageTag = $window.document.getElementById("imageCropSource");
				$scope.currentImageWidth = imageTag.offsetWidth;
				$scope.currentImageHeight = imageTag.offsetHeight;

				// Load the original image again (from the cache), so we can see what the original size is.
				var originalImage = new Image();

				originalImage.onload = function() {
					$scope.originalImageWidth = this.width;
					$scope.originalImageHeight = this.height;

					$scope.scaleFactor = this.width / imageTag.offsetWidth;
				};

				originalImage.src = imageTag.src;
			};


			var mouseModifyingRectangle = false;
			var currentResizingFunc;

			// Moved these to function calls because there is logic based on whether there is any scroll active or not
			var calculateMouseXRelative = function(e){
				    if(scrollLeft){
				   		mouseXRelative = e.pageX - offset.left - scrollLeft;
					} else {
						mouseXRelative = e.pageX - offset.left;
					}
			};

			var calculateMouseYRelative = function(e){
					if(scrollTop){
				    	mouseYRelative = e.pageY - offset.top - scrollTop;
				    } else {
				    	mouseYRelative = e.pageY - offset.top;
				    }
			};

			var resetBackgroundColor = function(){
				imageCropSelectorDiv.style.display = "none";
				$element[0].children[2].style.backgroundColor = "transparent";
			};

			var selectedBackgroundColor = function(){
				imageCropSelectorDiv.style.display = "block";
				$element[0].children[2].style.backgroundColor = "rgba(0,0,0,0.3)";
			};

			var horizontalScaling = function(xDelta, yDelta, origin){
				if(origin === 0){ // Left
					rectangleWidth += xDelta;

					if(rectangleWidth >= 0){
						rectangleLeft -= xDelta;
					}

				} else { // Right
					rectangleWidth -= xDelta;
				}

				if(rectangleWidth < 0){
					rectangleWidth = 0;
				}


				if(rectangleLeft < 0){
					rectangleLeft = 0;
				}

				if(rectangleWidth + rectangleLeft > imageTag.offsetWidth){
					rectangleWidth = imageTag.offsetWidth - rectangleLeft;
				}


			    if($scope.aspectRatio){

				    if(rectangleWidth * (aspectRatioY/aspectRatioX) + rectangleTop > imageTag.offsetHeight){
						rectangleWidth = (imageTag.offsetHeight - rectangleTop) / (aspectRatioY/aspectRatioX);
					}

			   		rectangleHeight = rectangleWidth * (aspectRatioY/aspectRatioX);
				}

			};

			var verticalScaling = function(xDelta, yDelta, origin){


				if(origin === 0){ // Top
					rectangleHeight += yDelta;

					if(rectangleHeight >= 0){
						rectangleTop -= yDelta;
					}

				} else { // Bottom
					rectangleHeight -= yDelta;
				}

				if(rectangleHeight < 0){
					rectangleHeight = 0;
				}

				// Make sure the div doesn't break out of its container.
				if(rectangleTop < 0){
					rectangleTop = 0;
				}

				if(rectangleHeight + rectangleTop > imageTag.offsetHeight){
					rectangleHeight = imageTag.offsetHeight - rectangleTop;
				}


				// Make sure that we maintain our ratio
				if($scope.aspectRatio){
					if(rectangleHeight * (aspectRatioX/aspectRatioY) + rectangleLeft > imageTag.offsetWidth){
						rectangleHeight = (imageTag.offsetHeight - rectangleLeft) / (aspectRatioX/aspectRatioY);
					}

			   		rectangleWidth = rectangleHeight* (aspectRatioX/aspectRatioY);
				}
			};


			// Origin starts at top-left and rotates clockwise.
			var diagonalScaling = function(xDelta, yDelta, origin){
				if(origin === 0){ // Top-left
					rectangleWidth += xDelta;
					if(rectangleWidth > 0 || (rectangleWidth <= 0 && xDelta > 0) ){
						rectangleLeft -= xDelta;
					}

					if(rectangleWidth < 0){
						rectangleWidth = 0;
					}

					if(rectangleLeft < 0){
						rectangleLeft = 0;
					}

					if(rectangleWidth + rectangleLeft > imageTag.offsetWidth){
						rectangleWidth = imageTag.offsetWidth - rectangleLeft;
					}

					if($scope.aspectRatio){

					    if(rectangleWidth * (aspectRatioY/aspectRatioX) + rectangleTop > imageTag.offsetHeight){
							rectangleWidth = (imageTag.offsetHeight - rectangleTop) / (aspectRatioY/aspectRatioX);
						}

	 			   		var newRectangleHeight = rectangleWidth * (aspectRatioY/aspectRatioX);
					   	var heightDelta = rectangleHeight - newRectangleHeight;
						rectangleTop += heightDelta;

						if(rectangleTop < 0){
							rectangleTop = 0;
						}
						rectangleHeight = newRectangleHeight;

 					} else {

 						rectangleTop -= yDelta;
 						rectangleHeight += yDelta;
 					}
				} else if(origin === 1){ // Top-right
					verticalScaling(xDelta, yDelta, 0);

					if(!$scope.aspectRatio){
						horizontalScaling(xDelta, yDelta, 1);
					}
				} else if (origin === 2) { // Bottom-right
					verticalScaling(xDelta, yDelta, 1);

					if(!$scope.aspectRatio){
						horizontalScaling(xDelta, yDelta, 1);
					}
				} else if(origin === 3){ // Bottom-left
					horizontalScaling(xDelta, yDelta, 0);
				
					if(!$scope.aspectRatio){
						verticalScaling(xDelta, yDelta, 1);
					}
				}

				drawRectangle();
			};


			var translate = function(xDelta, yDelta){

				if(rectangleLeft - xDelta > 0 && rectangleLeft - xDelta + rectangleWidth < imageTag.offsetWidth){
					rectangleLeft -= xDelta;
				} else if(rectangleLeft - xDelta < 0){
					rectangleLeft = 0;
				} else if(rectangleLeft - xDelta + rectangleWidth > imageTag.offsetWidth){
					rectangleLeft = imageTag.offsetWidth - rectangleWidth;
				}

				if(rectangleTop - yDelta > 0 && rectangleTop - yDelta + rectangleHeight < imageTag.offsetHeight){
					rectangleTop -= yDelta;
				} else if(rectangleTop - yDelta < 0){
					rectangleTop = 0;
				} else if(rectangleTop - yDelta + rectangleHeight > imageTag.offsetHeight){
					rectangleTop = imageTag.offsetHeight - rectangleHeight;
				}
			};

			function resetInteractions(){
		        draggingRectangle = false;
		        mouseModifyingRectangle = false;					
			}


			function calculateRectangleDimensions(mouseX, mouseY, oldMouseX, oldMouseY){
				var tempHolder; 
				var width;
				var height;

				if(mouseX < oldMouseX){
					tempHolder = mouseX;
					mouseX = oldMouseX;
					oldMouseX = tempHolder;
				} 

				if(mouseY < oldMouseY){
					tempHolder = mouseY;
					mouseY = oldMouseY;
					oldMouseY = tempHolder;
				} 

				width = mouseX - oldMouseX;

				// Figure out if enforcing the aspect ratio any further than we already have would
				// break the crop out of the parent div.
				if($scope.aspectRatio){
					if(width * (aspectRatioY/aspectRatioX) + oldMouseY > imageTag.offsetHeight){
						width = (imageTag.offsetHeight - oldMouseY) / (aspectRatioY/aspectRatioX);
					}
				}

			    if($scope.aspectRatio){
			   		height = width * (aspectRatioY/aspectRatioX);
				} else {
					height = mouseY - oldMouseY;
				}


				oldMouseY += dragCorrectionY;
				oldMouseX += dragCorrectionX;


				if(oldMouseX + width > imageTag.offsetWidth){
					oldMouseX = imageTag.offsetWidth - width;
				}

				if(oldMouseY + height > imageTag.offsetHeight){
					oldMouseY = imageTag.offsetHeight - height;
				}

				// Prevent crop-box from leaving the boundaries of the div. Snap
				// to the closest edge if outside of element. 
				if(oldMouseX < 0){
					oldMouseX = 0;
					dragCorrectionX = 0;
				}

				if(oldMouseY < 0){
					oldMouseY = 0;
					dragCorrectionY = 0;
				}

				rectangleLeft = oldMouseX;
				rectangleTop = oldMouseY;
				rectangleWidth = width;
				rectangleHeight = height;
			}


			var onMouseUpFunction = function(e){
				originalDragX = 0;
				originalDragY = 0;
				e.preventDefault();
				resetInteractions();

				if(resizingRectangle){
					stopResizing(e);
				}
			};

			var onScrollFunction = function(){
			    scrollLeft = ($window.pageXOffset || $window.document.scrollLeft) - ($window.document.clientLeft || 0);
			    scrollTop = ($window.pageYOffset || $window.document.scrollTop)  - ($window.document.clientTop || 0);
			};

			function drawRectangle(){
			   	// Move the correct part of the background image into the view/
			   	imageCropSelectorDiv.style.backgroundPosition =  "-"+(rectangleLeft+1)+"px" + " -"+(rectangleTop+1)+"px";
			   	imageCropSelectorDiv.style.backgroundSize = imageTag.offsetWidth+"px";
			   	imageCropSelectorDiv.style.backgroundRepeat = "no-repeat";

				// Set the top and left position of the div. 
			    imageCropSelectorDiv.style.left = rectangleLeft+"px";
			   	imageCropSelectorDiv.style.top = rectangleTop+"px";

			   	// Set Div Height and Width
				imageCropSelectorDiv.style.width = rectangleWidth  + "px";
				imageCropSelectorDiv.style.height = rectangleHeight + "px";

				selectedBackgroundColor();

				$scope.displayHeight = Math.round(rectangleHeight);
				$scope.displayWidth = Math.round(rectangleWidth);
				$scope.scaledHeight = Math.round(rectangleHeight * $scope.scaleFactor);
				$scope.scaledWidth = Math.round(rectangleWidth * $scope.scaleFactor);
				$scope.scaledLeft = Math.round(rectangleLeft * $scope.scaleFactor);
				$scope.scaledTop =  Math.round(rectangleTop * $scope.scaleFactor);
				$scope.$parent.$apply();
			}

			function startTranslation(e){
				e.preventDefault();
				e.stopPropagation();
				draggingRectangle = true;
			    originalDragX = e.pageX;
			    originalDragY = e.pageY;
			}

			function midTranslation(e){
				var newDragX;
				var newDragY;

				newDragX = e.pageX;
			    newDragY = e.pageY;
			    translate(originalDragX - newDragX, originalDragY - newDragY);
			   	originalDragX = newDragX;
			    originalDragY = newDragY;
			    drawRectangle();
			}

			function stopTranslation(){
				resizingRectangle = false;
			}

			function stopResizing(){
			    resizingRectangle = false;
			}

			function midResizing(e){
				var currentResizeMouseX;
				var currentResizeMouseY;

				e.preventDefault();
				e.stopPropagation();
				currentResizeMouseX = e.pageX;
			    currentResizeMouseY = e.pageY;
			    currentResizingFunc(startResizeMouseX - currentResizeMouseX, startResizeMouseY - currentResizeMouseY, currentResizeOrigin);
			    startResizeMouseX = currentResizeMouseX;
			    startResizeMouseY = currentResizeMouseY;
				drawRectangle();
			}

			function startResizing(e, origin, resizeFunction){
				e.preventDefault();
				e.stopPropagation();
				startResizeMouseX = e.pageX;
			    startResizeMouseY = e.pageY;

			    resizingRectangle = true;
			    currentResizeOrigin = origin;
			    currentResizingFunc = resizeFunction;
			}

			// Instantiate translate event.
			imageCropSelectorDiv.addEventListener("mousedown", function(e){
		        startTranslation(e);
		        focusedOnCrop = true;
			});

			// Instantiate crop rectangle. 
			$element[0].children[2].addEventListener("mousedown", function(e){
		        e.preventDefault();
				mouseModifyingRectangle = true;
				focusedOnCrop = true;

			    // All coordinates are relative to the parent container
			    offset = this.getBoundingClientRect();
			    if(scrollLeft){
			   		originalMouseX = e.pageX - offset.left - scrollLeft;
				} else {
					originalMouseX = e.pageX - offset.left;
				}

				if(scrollTop){
			    	originalMouseY = e.pageY - offset.top - scrollTop;
			    } else {
			    	originalMouseY = e.pageY - offset.top;
			    }


			});

			// Move the crop rectangle.
			$element[0].children[2].addEventListener("mousemove", function(e){
				if(draggingRectangle){
					midTranslation(e);
				}
				if(mouseModifyingRectangle){
				    offset = this.getBoundingClientRect();
					calculateMouseXRelative(e);
					calculateMouseYRelative(e);

				    dragCorrectionX = 0;
				    dragCorrectionY = 0;
				   	calculateRectangleDimensions(mouseXRelative, mouseYRelative, originalMouseX, originalMouseY);
				   	drawRectangle();
			   }

			   if(resizingRectangle){
			   		midResizing(e);
			   }
			});

			imageCropSelectorDiv.addEventListener("mousemove", function(e){
				e.preventDefault();
				if(mouseModifyingRectangle){
				    offset = $element[0].children[2].getBoundingClientRect();
					calculateMouseXRelative(e);
					calculateMouseYRelative(e);

				   	calculateRectangleDimensions(mouseXRelative, mouseYRelative, originalMouseX, originalMouseY);
				   	drawRectangle();
			  	}

				if(draggingRectangle){
					midTranslation(e);
				}

				if(resizingRectangle){
					midResizing(e);
				}
			});

			$element[0].children[2].addEventListener("mouseup", function(){
 				resetInteractions();
			});

			imageCropSelectorDiv.addEventListener("mouseup", function(e){
				originalDragX = 0;
				originalDragY = 0;
				e.preventDefault();
				resetInteractions();
			});			

			angular.element($window).on('mouseup',onMouseUpFunction);
			$scope.$on("$destroy", function() {
				angular.element($window).off('scroll',onMouseUpFunction);
			});

			angular.element($window).on('scroll',onScrollFunction);
			$scope.$on("$destroy", function() {
				angular.element($window).off('scroll',onScrollFunction);
			});



			$element[0].children[2].addEventListener("mouseout", function(e){
				if(mouseModifyingRectangle){
				    offset = this.getBoundingClientRect();
					calculateMouseXRelative(e);

				    if(mouseXRelative > $scope.currentImageWidth){
				    	mouseXRelative = $element[0].children[0].offsetWidth;
				    } else if(mouseXRelative < 0){
				    	mouseXRelative = 0;
				    }
					calculateMouseYRelative(e);

				    if(mouseYRelative < 0){
				    	mouseYRelative = 0;
				    }


				   	calculateRectangleDimensions(mouseXRelative, mouseYRelative, originalMouseX, originalMouseY);
				   	drawRectangle();
				}
			});			

			$element[0].children[2].addEventListener("dblclick", function(){
				if(!draggingRectangle && !resizingRectangle && !mouseModifyingRectangle){
					resetBackgroundColor();
				}
			});



			// TODO (maybe): Loop through an array of string values, and generate this dynamically. 
			// Won't look as atrocious or require as many repeated lines of code.

			// Diagonal Scaling - Blagh.
			$window.document.getElementById("resize_top_left").addEventListener("mousedown", function(e){
				startResizing(e, 0, diagonalScaling);
			});

			$window.document.getElementById("resize_top_right").addEventListener("mousedown", function(e){
				startResizing(e, 1, diagonalScaling);
			});

			$window.document.getElementById("resize_bottom_right").addEventListener("mousedown", function(e){
				startResizing(e, 2, diagonalScaling);
			});

			$window.document.getElementById("resize_bottom_left").addEventListener("mousedown", function(e){
				startResizing(e, 3, diagonalScaling);
			});



			// Horizontal Scaling. Yay!
			$window.document.getElementById("resize_middle_left").addEventListener("mousedown", function(e){
				startResizing(e, 0, horizontalScaling);
			});

			$window.document.getElementById("resize_left").addEventListener("mousedown", function(e){
				startResizing(e, 0, horizontalScaling);
			});

			$window.document.getElementById("resize_middle_right").addEventListener("mousedown", function(e){
				startResizing(e, 1, horizontalScaling);
			});

			$window.document.getElementById("resize_right").addEventListener("mousedown", function(e){
				startResizing(e, 1, horizontalScaling);
			});



			// Vertical Scaling. Yay!
			$window.document.getElementById("resize_top_middle").addEventListener("mousedown", function(e){
				startResizing(e, 0, verticalScaling);
			});

			$window.document.getElementById("resize_top").addEventListener("mousedown", function(e){
				startResizing(e, 0, verticalScaling);
			});


			$window.document.getElementById("resize_bottom_middle").addEventListener("mousedown", function(e){
				startResizing(e, 1, verticalScaling);
			});

			$window.document.getElementById("resize_bottom").addEventListener("mousedown", function(e){
				startResizing(e, 1, verticalScaling);
			});


		}]
	};
}]); 