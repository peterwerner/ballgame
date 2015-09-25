

$(document).ready(function() {

    document.addEventListener("deviceready", onDeviceReady, true);
    
    // are we running in native app or in a browser?
    window.isphone = false;
    if(document.URL.indexOf("http://") === -1 
        && document.URL.indexOf("https://") === -1) {
        window.isphone = true;
    }
    
    // Prevent scrolling
    document.addEventListener('touchmove', function(e) { e.preventDefault(); }, false);

});


function onDeviceReady() {
    var c = document.getElementById("canvasMain");
    c.width = document.body.clientWidth;
    c.height = document.body.clientHeight;
    var ctx = c.getContext("2d");

    var pad = c.width / 20;
    var yPos = pad + (c.height - c.width) / 2;
    var connections = [
        [["up", "right"], ["left", "right"], ["down", "left"]],
        [["down", "right"], ["up", "down", "left", "right"], ["up", "left"]],
        [["up", "right"], ["left", "right"], ["down", "left"]],
    ];
    var gameBoard = new GameBoard(pad, yPos, c.width - 2 * pad, 3, c.width, c.height, ctx, connections);

    // Touch events
    document.addEventListener('touchstart', function(e) { 
        e.preventDefault(); 
        var touch = e.touches[0];
        var x = touch.pageX - c.offsetLeft;
        var y = touch.pageY - c.offsetTop;
        gameBoard.takeInput(x, y);
    }, false);

    // Game loop
    var deltaTime = 0;
    var timePerFrameMin = 20;
    gameLoop();
    function gameLoop() {
        ctx.clearRect(0, 0, c.width, c.height);

        timeStart = (new Date()).getTime();

        gameBoard.update(deltaTime);
        gameBoard.paint(ctx);

        deltaTime_prev = (new Date()).getTime() - timeStart;
        deltaTime = deltaTime_prev;
        if(deltaTime_prev < timePerFrameMin) {
            deltaTime = timePerFrameMin;
        }
        setTimeout(gameLoop, timePerFrameMin - deltaTime_prev);
    }
}



