var ASPECT_RATIO;
var CLICKABLE_WIDTH = 3;
const ARENA_ELEMENT = document.getElementById("arena");
var ELEMENT_LIFETIME = 1; // in seconds
var SPAWN_DELAY = 2; // in seconds
var SPAWN_PIVOT_POINT = {x: 50, y: 50};
var SPAWNSIDE = 0; //0: BOT 1: TOP
var MIN_DISTANCE_FROM_PIVOT = 3;

(function onInit(){
	//init global variables
	ASPECT_RATIO = window.innerHeight/window.innerWidth;
	
	initEvents();

	setInterval(() => {
		if(SPAWNSIDE == 0){
			var coordinates = getCoordinate(true);
			spawnClickable(coordinates.x,coordinates.y);
			SPAWNSIDE = 1;
		}
		else {
			var coordinates = getCoordinate(false);
			spawnClickable(coordinates.x,coordinates.y);
			SPAWNSIDE = 0;
		}
	}, SPAWN_DELAY * 50);

});

function initEvents(){
	window.addEventListener("resize", (event) => {
		ASPECT_RATIO = window.innerHeight/window.innerWidth;
	}, false);
}

function spawnClickable(x, y){
	var clickable = document.createElement("div");

	clickable.classList.add("clickable");
	clickable.style.width = CLICKABLE_WIDTH + "%";
	clickable.style.height = CLICKABLE_WIDTH / ASPECT_RATIO + "%";

	clickable.style.top = x + "%";
	clickable.style.left = y + "%";

	ARENA_ELEMENT.appendChild(clickable);

	setTimeout(() => {
		clickable.remove();
	}, ELEMENT_LIFETIME * 300);
}

function getCoordinate(topSide) {
    let x, y;

    if(topSide){
		do {
	        x = Math.floor(Math.random() * 21) - 10;
	        y = Math.floor(Math.random() * 21) - 10;
    	} while (y <= -x); // Ensure y > -x
    }
    else {
		do {
	        x = Math.floor(Math.random() * 21) - 10;
	        y = Math.floor(Math.random() * 21) - 10;
    	} while (y >= -x); // Ensure y < -x
    }


    return { x: (x + MIN_DISTANCE_FROM_PIVOT) + SPAWN_PIVOT_POINT.x, y: (y + MIN_DISTANCE_FROM_PIVOT) + SPAWN_PIVOT_POINT.y };
}