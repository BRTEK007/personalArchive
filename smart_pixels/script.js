'use strict';
function sleep(ms) {return new Promise(resolve => setTimeout(resolve, ms));}
function rgb(r, g, b){return "rgb("+r+","+g+","+b+")";}

function frame() {
	requestAnimationFrame(frame);
    ctx.clearRect(0,0,canvas.width, canvas.height);
	if(MOUSE.down) applyForceToAgents();
	for(let i = 0; i < agents.length; i++){
        	agents[i].update();
			agents[i].render(ctx);
	}
}

//notes display image on ctx and get image data, display text on ctx and get image data

var canvas;
var ctx;
var agents;
const MOUSE = {
	down: false,
	x : 0,
	y : 0
};
const SETTINGS = {
    forceFunction: forceFunction2,
    moving_mode: false,
    pixel_size: 20,
    offset: {x : 0, y : 0},
    loaded_image: 0
};

async function loadAgents(_x){
    let ctx2 = document.createElement("canvas").getContext('2d');
    var image = new Image();
    image.src = "image.gif";
	await sleep(50);
    ctx2.drawImage(image, 0, 0, image.width, 32);
	await sleep(50);
	var pixels = ctx2.getImageData(_x*32, 0, 32, 32).data;
    agents = [];
    for(let y = 0; y < 32; y++){
		for(let x = 0; x < 32; x++){
			let id = x + y*32;
			/*for(let i = 0; i < 4; i++){
				c += pixels[id*4 + i];
			}*/
			let r = pixels[id*4];
			let g = pixels[id*4+1];
			let b = pixels[id*4+2];
			let a = pixels[id*4+3];
			if(a != 0){
				let ax = x;
				let ay = y;
				agents.push(new Agent(ax,ay, rgb(r,g,b) ));
			}
		}
	}
}

async function setup(){
	dragElement(document.getElementById("menuDiv"));
	canvas = document.getElementById('myCanvas');
	canvas.width = canvas.getBoundingClientRect().width;//1563
	canvas.height = canvas.getBoundingClientRect().height;//768
	ctx = canvas.getContext("2d");
	canvas.addEventListener('mousedown', (e) => {MOUSE.down = true; MOUSE.x = e.offsetX; MOUSE.y = e.offsetY} );
	canvas.addEventListener('mousemove', (e) => {MOUSE.x = e.offsetX; MOUSE.y = e.offsetY} );
	canvas.addEventListener('mouseup', (e) => {MOUSE.down = false;} );
	canvas.addEventListener('mouseleave', (e) => {MOUSE.down = false;} );
	canvas.addEventListener('wheel', (e) => {
		SETTINGS.pixel_size += e.deltaY/100;
		SETTINGS.pixel_size = Math.min(Math.max(SETTINGS.pixel_size, 10), 50);
	});
    
    SETTINGS.offset.x = canvas.width/2 - SETTINGS.pixel_size*32/2;
    SETTINGS.offset.y = canvas.height/2 - SETTINGS.pixel_size*32/2;

    SETTINGS.loaded_image = Math.floor(Math.random() * 7);
    await loadAgents(SETTINGS.loaded_image);
    
	requestAnimationFrame(frame);
}

class Agent{
	constructor(_rx, _ry, _c){
        this.imagePos = new Vector2D(_rx, _ry);
		this.restPos = new Vector2D(
            _rx * SETTINGS.pixel_size + SETTINGS.offset.x, 
            _ry*SETTINGS.pixel_size + SETTINGS.offset.y);
        this.pos = new Vector2D(this.restPos.x, this.restPos.y);
        this.color = _c;
        this.hasReachedRest = true;
        this.speed = 10;
        
		this.vel = new Vector2D(0,0);
		this.drag = 0.9;
	}
	update(){
        if(this.hasReachedRest) return;
		var dir = this.restPos.sub(this.pos);
		this.vel = this.vel.add(dir.unit());
		this.vel = this.vel.mult(this.drag);
		this.pos = this.pos.add(this.vel);

		if(dir.mag() < this.vel.mag()){
			this.pos = this.restPos.copy();
            this.hasReachedRest = true;
			this.vel = new Vector2D(0,0);
        }
	}
	render(_ctx){
		_ctx.fillStyle = this.color;
        _ctx.beginPath();
		//ctx.arc(this.pos.x, this.pos.y, 10, 0, Math.PI*2);
		_ctx.rect(this.pos.x, this.pos.y,SETTINGS.pixel_size,SETTINGS.pixel_size);
		_ctx.fill();
	}
}

class Vector2D{
	constructor(_x, _y){
		this.x = _x;
		this.y = _y;
	}
	mag(){
		return Math.sqrt(this.x*this.x + this.y*this.y);
	}
    mag_sqr(){
        return this.x*this.x + this.y*this.y;
    }
	unit(){
		let m = this.mag();
		if(m == 0) return new Vector2D(0,0);
		return new Vector2D(this.x/m, this.y/m);
	}
	mult(m){
		return new Vector2D(this.x * m, this.y * m); 
	}
	add(v){
		return new Vector2D(this.x + v.x, this.y + v.y);
	}
	sub(v){
		return new Vector2D(this.x - v.x, this.y - v.y);
	}
	copy(){
		return new Vector2D(this.x, this.y);
	}
}

function applyForceToAgents(){
	for(let i = 0; i < agents.length; i++){
		var dir = agents[i].pos.sub(new Vector2D(MOUSE.x, MOUSE.y));
		//var mag = dir.mag();
        SETTINGS.forceFunction(agents[i], dir);
        //forceFunction1(agents[i], dir);
		//agents[i].vel = agents[i].vel.add(dir.unit().mult(2000/(dir.mag_sqr())));
		//agents[i].vel = agents[i].vel.sub(dir.unit().mult(2));
		//agents[i].vel = agents[i].vel.sub(dir.mult(0.005));
		agents[i].pos = agents[i].pos.add(agents[i].vel);
		agents[i].hasReachedRest = false;
	}
}

function forceFunction1(_a, _v){_a.vel = _a.vel.add(_v.unit().mult(2000/(_v.mag_sqr())));}
function forceFunction2(_a, _v){_a.vel = _a.vel.sub(_v.unit().mult(2));}
function forceFunction3(_a, _v){_a.vel = _a.vel.sub(_v.mult(0.005));}

function dragElement(elmnt) {
	var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
	elmnt.onmousedown = dragMouseDown;
	
  
	function dragMouseDown(e) {
		e = e || window.event;
		//e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		// call a function whenever the cursor moves:
		document.onmousemove = elementDrag;
	}
  
	function elementDrag(e) {
		e = e || window.event;
		//e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
		elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
	}
  
	function closeDragElement() {
		// stop moving when mouse button is released:
		document.onmouseup = null;
		document.onmousemove = null;
	}
  }

async function DOM_change_image(_d){
    SETTINGS.loaded_image += parseInt(_d);
    if(SETTINGS.loaded_image > 7) SETTINGS.loaded_image = 0;
    else if(SETTINGS.loaded_image < 0) SETTINGS.loaded_image = 7;
    await loadAgents(SETTINGS.loaded_image);
}

function DOM_change_force(_n){
    switch(parseInt(_n)){
        case 1: SETTINGS.forceFunction = forceFunction1; break;
        case 2: SETTINGS.forceFunction = forceFunction2; break;
        case 3: SETTINGS.forceFunction = forceFunction3; break;
    }
}