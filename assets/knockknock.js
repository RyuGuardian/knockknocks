'use strict';

angular.module('kkApp', [])
	.controller('KnockCtrl', function ($scope, $http, $location) {
		$scope.showLogin = true;
		$scope.showStart = null;
		$scope.showNew = null;
		$scope.showHear = null;
		$scope.User = {};
		$scope.Token = {};
		$scope.JokeToken = {};
		$scope.Joke = {};
		$scope.errorMessage = '';
		$scope.alreadyRated = false;

		//////// login
		$scope.register = function() {
			if ($scope.User.email) {
				$http.post('/signup', $scope.User).
					success(function(data) {
						$scope.errorMessage = 'Signup successful! Log in for knockknocks.'
						$scope.User.email = '';
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			} else {
				var Auth = { headers: { Authorization: 'Basic ' + 
										btoa($scope.User.username + ':' + $scope.User.password),
									Accept: 'application/json;odata=verbose'
					}
				};
				$http.get('/login', Auth).
					success(function(data) {
						$scope.Token = data;
						$scope.errorMessage = '';
			    	$scope.showLogin = !($scope.showStart = true);
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			}

			//////// start
	    $scope.newJoke = function() {
	    	$scope.Joke = {};
	    	$scope.showLogin = $scope.showStart = $scope.showHear = !($scope.showNew = true);
	    	$scope.showPunch = $scope.showNextSteps = false;
				$http.post('/joke', $scope.Token).
					success(function(jokeStart) {
						$scope.JokeToken = jokeStart.token;
						$scope.showSetup = true;
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
	    };
			$scope.hearJoke = function() {
	    	$scope.showLogin = $scope.showStart = $scope.showNew = !($scope.showHear = true);
	    	$scope.showHearSetup = $scope.showNextSteps = false;
	    	$scope.alreadyRated = false;
				$http.post('/knockknock', $scope.Token).
					success(function(joke) {
						$scope.Joke = { ID: joke.jtoken };
						$scope.JokeToken = joke.jtoken;
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			};
			$scope.logoff = function() {
				$scope.Token = {};
	    	$scope.showStart = $scope.showHear = $scope.showNew = !($scope.showLogin = true);
			};

			//////// newjoke
			$scope.newSetup = function(setup) {
				$http.post('/joke/setup', { setup: $scope.Joke.setup,
																		token: $scope.Token.token }).
					success(function(joke) {
						$scope.showPunch = true;
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			};
			$scope.newPunchline = function(punchline) {
				$http.post('/joke/punchline', { setup: $scope.Joke.setup,
																				punchline: $scope.Joke.punchline,
																			 	token: $scope.Token.token }).
					success(function(joke) {
						$scope.finishJoke = joke.msg;
						$scope.showNextSteps = true;
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			};

			//////// hearjoke
			$scope.hearSetup = function() {
				$http.post('/whosthere', {	token: $scope.Token.token,
																		jtoken: $scope.JokeToken } ).
					success(function(joke) {
						$scope.Joke.setup = joke.msg;
						$scope.showHearSetup = true;
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			};
			$scope.hearPunchline = function() {
				$http.post('/punchline', {	token: $scope.Token.token,
																		jtoken: $scope.JokeToken } ).
					success(function(joke) {
						$scope.Joke.punchline = joke.msg;
						$scope.showNextSteps = true;
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			};
			$scope.rateJoke = function(rating) {
				$http.post('/rate', {	token: $scope.Token.token,
															jtoken: $scope.JokeToken,
															rating: rating } ).
					success(function(newRating) {
						$scope.Joke.rating = newRating;
						$scope.alreadyRated = true;
					}).error(function(err) {
						$scope.errorMessage = err.msg;
					});
			};
		}
	});
