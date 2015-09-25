
// 
// Gameboard class
function GameBoard (x, y, width, numTilesPerRow, screenWidth, screenHeight, canvasContext, connections) {
    this.score = 0;
    // Dimensions
    this.x = x;
	this.y = y;
	this.width = width;
	this.numTilesPerRow = numTilesPerRow;
	// Dimensions of the full screen
	this.screenWidth = screenWidth;
	this.screenHeight = screenHeight;
	// Tiles that this maintains
	this.tiles = [];
	var tileWidth = this.width / numTilesPerRow;
	for (var i = 0; i < numTilesPerRow; i++) {
		var subTiles = [];
		for (var j = 0; j < numTilesPerRow; j++) {
			var tile = new GameTile(x + (tileWidth * j), y + (tileWidth * i), tileWidth, connections[i][j]);
			subTiles.push(tile);
		}
		this.tiles.push(subTiles);
	}
	// Free balls
	this.freeBalls = [];
	// Template ball objects to use
	this.ballTemplates = [
		new GameBall (0, "#FF0000", 10, this.tiles[0][0].barWidth / 1.7, 0, 0),
		new GameBall (numTilesPerRow - 1, "#0099FF", 10, this.tiles[0][0].barWidth / 1.7, 0, 0),
	];
	// Spawn points
	this.spawnPoints = [];
	for (var i = 0; i < this.numTilesPerRow; i++) {
		var xPos = this.x + (this.width * (i + .5) / this.numTilesPerRow);
		this.spawnPoints.push([xPos, -this.tiles[0][0].barWidth]);
	}
	this.timeSinceLastSpawn = 0;
	// Graphics controllers
	this.gibs = new GibMaker();
}




GameBoard.prototype.update = function(deltaTime) {
	// Update the spawn timer and spawn a ball if necessary
	this.timeSinceLastSpawn += deltaTime;
	if (this.timeSinceLastSpawn > 1000  &&  this.countBalls() < 7) {
		this.spawnRandom();
		this.timeSinceLastSpawn = 0;
	}

	// Update game tiles
	for (var i = 0; i < this.tiles.length; i++) {
		for (var j = 0; j < this.tiles[i].length; j++) {
			this.tiles[i][j].update(deltaTime);
		}
	}
	// Move free balls down until they hit the gameboard
	var ballsAtDest = [];
	for (var i = 0; i < this.freeBalls.length; i++) {
		var ball = this.freeBalls[i];
		ball.moveTo(deltaTime, ball.x, this.y);
		// Record the indices balls that have reached their destinations
		if (ball.y == this.y)
			ballsAtDest.push(i);
	}
	// Attempt to parent balls once they have reached the board
	ballsAtDest.sort();
	ballsAtDest.reverse();
	for (var i = 0; i < ballsAtDest.length; i++) {
		var goodParent = false;
		for (var j = 0; j < this.tiles[0].length && !goodParent; j++) {
			var ball = this.freeBalls[i]; 
			if (this.tiles[0][j].checkCoords(ball.x, ball.y, 2))
				goodParent = this.tiles[0][j].attemptParent(ball, "up");
		}
		if (!goodParent) {
			// TODO: DO SOMETHING WITH BALLS THAT HAVE NOTHING TO ATTACH TO
		}
		this.freeBalls.splice(ballsAtDest[i], 1);
	}
	// Manage parented balls that have reached their destinations
	//		Parent to an adjacent tile if possible
	//		Otherwise, bounce back onto the same tile
	for (var i = 0; i < this.tiles.length; i++) {
		for (var j = 0; j < this.tiles[i].length; j++) {
			for (var k = this.tiles[i][j].balls.length - 1; k >= 0 ; k--) {
				if (this.tiles[i][j].balls[k].actionQueue.length < 1) {
					// Parent to an adjacent tile if possible
					var opposites = {"up": "down", "down": "up", "left": "right", "right": "left"};
					var adjust = {"up":[0,-1], "down":[0,1], "left":[-1,0], "right":[1,0]};
					var key = this.tiles[i][j].balls[k].lastAction.position;
					var goodParent = false;
					if (!(key == null) && !(key == undefined)) {
						var	newJ = j + adjust[key][0],
							newI = i + adjust[key][1];
						if (newJ >= 0 && newI >= 0 && newJ < this.numTilesPerRow && newI < this.numTilesPerRow) {
							// Attempt to parent to the adjacent tile
							var dir = opposites[key],
								ball = this.tiles[i][j].balls[k];
							goodParent = this.tiles[newI][newJ].attemptParent(ball, dir);
							if (goodParent)
								this.tiles[i][j].balls.splice(k, 1);
						}
					}
					// If parenting to adjacent tile failed, parent back to self
					if (!goodParent) {
						this.tiles[i][j].balls[k].actionQueue = [this.tiles[i][j].tilePoints[0]];
						var entry = this.tiles[i][j].balls[k].lastAction,
							exit = this.tiles[i][j].getExitPoint(entry);
						this.tiles[i][j].balls[k].actionQueue.push(exit);
					}
				}
			}
		}
	}

	this.handleCollisions(deltaTime);
	// Kill all balls marked for death during collisions
	for (var i = this.freeBalls.length - 1; i >= 0; i--)
		if (this.freeBalls[i].markedForDeath)
			this.freeBalls.splice(i, 1);
	for (var i = 0; i < this.tiles.length; i++)
		for (var j = 0; j < this.tiles[i].length; j++)
			for (var k = this.tiles[i][j].balls.length - 1; k >= 0 ; k--)
				if (this.tiles[i][j].balls[k].markedForDeath)
					this.tiles[i][j].balls.splice(k, 1);

	// update graphics controllers
	this.gibs.update(deltaTime);
}


GameBoard.prototype.handleCollisions = function(deltaTime) {
	// How strict should collisions be?
	// ie: tolerance .10 means that two 10cm objects can be at most 1cm inside each other and still not be colliding
	var tolerance = .30;
	// List of pairs to combine (pairs should be sorted ie: [0, 1])
	var pairsToCombine = [];

	var balls = this.getAllBalls();
	for (var i = 0; i < balls.length; i++) {
		for (var j = 0; j < balls.length; j++) {
			if (i != j && !balls[i].markedForDeath && !balls[j].markedForDeath) {
				var dist = Math.sqrt( Math.pow(balls[i].x - balls[j].x, 2) + Math.pow(balls[i].y - balls[j].y, 2) );
				// If balls are of different types collide... record for combination
				if (balls[i].type != balls[j].type) {
					if (dist < (1 - tolerance) * (balls[i].radius + balls[j].radius)) {
						balls[i].markForDeath();
						balls[j].markForDeath();
						// Generate an explosion effect
						var x = (balls[i].x + balls[j].x ) / 2,
							y = (balls[i].y + balls[j].y ) / 2,
							radius = (balls[i].radius + balls[j].radius) / 1.2,
							color = "#EB9CFF",
							alpha = 0.4,
							lifeTime = 1000;
						this.gibs.makeExplosion(x, y, radius * 4, color, alpha / 4, lifeTime);
						this.gibs.makeExplosion(x, y, radius * 2, color, alpha / 2, lifeTime);
						this.gibs.makeExplosion(x, y, radius, color, alpha, lifeTime, null);
					}
				}
				// If balls of same type collide... Mark them for death
				else if (dist < deltaTime * Math.max(balls[i].speed, balls[j].speed)) {
					pairsToCombine.push([i, j].sort());
				}
			}
		}
	}

	// Remove duplicates from the list of pairs to combine
	for (var i = pairsToCombine.length - 1; i >= 0; i--) {
		var duplicate = false;
		for (var j = pairsToCombine.length - 1; j >= 0; j--)
			if (i != j && pairsToCombine[i][0] == pairsToCombine[j][0] && pairsToCombine[i][1] == pairsToCombine[j][1])
				duplicates = true;
		if (duplicate)
			pairsToCombine.splice(i, 1);
	}
	// Combine pairs (randomly choose one ball to preserve and mark the other for death)
	for (var i = pairsToCombine.length - 1; i >= 0; i--) {
		var pair = pairsToCombine[i],
			master = Math.floor(Math.random() * 2),
			toKill = Math.abs(1 - master);
		if (!balls[pair[master]].markedForDeath && !balls[pair[toKill]].markedForDeath) {
			balls[pair[master]].score += balls[pair[toKill]].score;
			balls[pair[toKill]].markForDeath();
			// Generate a highlighting explosion effect
			var x = balls[pair[master]].x,
				y = balls[pair[master]].y,
				radius = balls[pair[master]].radius * 1.7,
				color = balls[pair[master]].color,
				alpha = 0.25,
				lifeTime = 300;
			this.gibs.makeExplosion(x, y, radius, color, alpha, lifeTime);
		}
	}
}




GameBoard.prototype.paint = function(canvasContext) {
	// Paint the board
	canvasContext.fillStyle = "#E0E0E0";
	for (var i = 0; i < this.numTilesPerRow; i++) {
		for (var j = 0; j < this.numTilesPerRow; j++) {
			var w = this.width / this.numTilesPerRow;
			canvasContext.fillRect(this.x + (w * i) + 1, this.y + (w * j) + 1, w - 2, w - 2);
		}
	}
	// Paint the top pipes
	var pipeWidth = this.tiles[0][0].barWidth;
	for (var i = 0; i < this.numTilesPerRow; i++) {
		var xPos = this.x + (this.width * (i + .5) / this.numTilesPerRow) - (.5 * pipeWidth);
		canvasContext.fillRect(xPos, 0, pipeWidth, this.y);
	}
	/*
	// Paint the colored bottom pipes
	var xPos = this.x + (this.width * .5 / this.numTilesPerRow) - (.5 * pipeWidth);
	canvasContext.fillStyle = this.ballTemplates[0].color;
	canvasContext.fillRect(xPos, this.y + this.width, pipeWidth, this.y);
	var xPos = this.x + (this.width * (this.numTilesPerRow - .5) / this.numTilesPerRow) - (.5 * pipeWidth);
	canvasContext.fillStyle = this.ballTemplates[1].color;
	canvasContext.fillRect(xPos, this.y + this.width, pipeWidth, this.y);
	*/
	// Paint game tiles
	for (var i = 0; i < this.tiles.length; i++) {
		for (var j = 0; j < this.tiles[i].length; j++) {
			this.tiles[i][j].paint(canvasContext);
		}
	}
	// Paint free balls
	for (var i = 0; i < this.freeBalls.length; i++)
		this.freeBalls[i].paint(canvasContext);
	// Paint balls parented to game tiles
	for (var i = 0; i < this.tiles.length; i++) {
		for (var j = 0; j < this.tiles[i].length; j++) {
			this.tiles[i][j].paintBalls(canvasContext);
		}
	}
	// Paint gibs
	this.gibs.paint(canvasContext);
}

GameBoard.prototype.takeInput = function(inX, inY) {
	// Pass input to appropriate game tile
	var tile = this.tileFromCoords(inX, inY);
	if (tile != null)
		tile.rotate90();
}

GameBoard.prototype.tileFromCoords = function(inX, inY) {
	for (var i = 0; i < this.tiles.length; i++) {
		for (var j = 0; j < this.tiles[i].length; j++) {
			if (this.tiles[i][j].checkCoords(inX, inY, 0))
				return this.tiles[i][j];
		}
	}
	return null;
}




// Spawn a random ball at a random spawn point
GameBoard.prototype.spawnRandom = function() {
	var template = this.ballTemplates[ Math.floor(Math.random() * this.ballTemplates.length) ],
		spawnPoint = this.spawnPoints[ Math.floor(Math.random() * this.spawnPoints.length) ];
	var ball = new GameBall(template.type, template.color, template.score, template.radius, spawnPoint[0], spawnPoint[1]);
	this.freeBalls.push(ball);
}




// Get a count of all balls on screen
GameBoard.prototype.countBalls = function() {
	return this.getAllBalls().length;
}

// Get a list of all balls on screen
GameBoard.prototype.getAllBalls = function() {
	var list = [];
	for (var i = 0; i < this.freeBalls.length; i++)
		list.push(this.freeBalls[i]);
	for (var i = 0; i < this.tiles.length; i++) {
		for (var j = 0; j < this.tiles[i].length; j++) {
			for (var k = this.tiles[i][j].balls.length - 1; k >= 0 ; k--) {
				list.push(this.tiles[i][j].balls[k]);
			}
		}
	}
	return list;
}