var app = angular.module('testImageCrop', []);

app.controller('ImageCroppingCtrl', ['$scope', function($scope){
	$scope.displayHeight = 0;
	$scope.displayWidth = 0;
	$scope.scaledWidth = 0;
	$scope.scaledHeight = 0;
	$scope.scaledTop = 0;
	$scope.scaledLeft = 0;
	$scope.aspectRatio = "15/23";
	$scope.imgSrc = "http://upload.wikimedia.org/wikipedia/commons/0/08/Mount_Everest_by_Kerem_Barut.jpg";
}]);
