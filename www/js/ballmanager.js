

// TODO -- MOVE THIS CODE TO GAMEBOARD

// 
// BallManager class
function BallManager (tiles) {
	this.tiles = tiles;
	// List of balls
	this.balls = [];
	// Template ball objects to use
	this.ballTemplates = [];
	// Spawn points
	this.spawnPoints = [];
}

// Add a spawn point (balls spawn from the top of the screen and move directly down)
// NOTE: this should only be used on the top row of tiles
BallManager.prototype.addSpawnPoint = function(tile) {
	this.spawnPoints.push( tile );
}

// Add a ball template
BallManager.prototype.addBallTemplate = function(ball) {
	this.ballTemplates.push( ball );
}

// Spawn a random ball at a random spawn point
BallManager.prototype.spawnRandom = function() {
	var template = this.ballTemplates[ Math.floor(Math.random() * this.ballTemplates.length) ],
		spawnPoint = this.spawnPoints[ Math.floor(Math.random() * this.spawnPoints.length) ];
	var x = spawnPoint.x + (spawnPoint.width / 2),
		y = 2 * template.radius;
	var ball = new GameBall(template.type, template.color, template.score, template.radius, x, y);
	this.balls.push(ball);
}

BallManager.prototype.update = function(deltaTime) {
	for (var i = this.balls.length - 1; i >= 0; i--) {
		var ball = this.balls[i],
			tile = this.tileFromCoords(ball.x, ball.y);
		ball.moveTo(deltaTime, ball.x, ball.y + 999);
		// If the ball reaches a tile...
		if (tile != null) {
			// Attempt to parent the ball to the tile - if it parents successfully, remove it from balls
			//if (tile.takeBall(ball, "up"))
			//	this.balls.splice(i, 1);
		}
	}
}

BallManager.prototype.paint = function(canvasContext) {
	for (var i = 0; i < this.balls.length; i++)
		this.balls[i].paint(canvasContext);
}

BallManager.prototype.tileFromCoords = function(inX, inY) {
	for (var i = 0; i < this.tiles.length; i++) {
		if (this.tiles[i].checkCoords(inX, inY))
			return this.tiles[i];
	}
	return null;
}