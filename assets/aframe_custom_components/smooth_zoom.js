require('aframe-look-at-component');

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { KawaseBlurPass, KernelSize } from 'postprocessing'

var NUMBER_OF_ROOMS = 0;
const IMAGE_LOAD_TIME = 350;
var THEME = -1;
var hasVideoPlayed = false;

var ndata;
var nthis;

var canMove = true;
var canRotate = true;
var quizOnRoomEl = null;
var currentRoom = 0;
var cameraAngle = 0;

var enabledBlur = false;
var blurPass;

AFRAME.registerComponent('hotspots',{
  init:function(){
    this.el.addEventListener('reloadspots',function(evt){
      //get the entire current spot group and scale it to 0
      var currspotgroup = document.getElementById(evt.detail.currspots);
      currspotgroup.setAttribute("scale","0 0 0");

      //get the entire new spot group and scale it to 1
      var newspotgroup = document.getElementById(evt.detail.newspots);
      newspotgroup.setAttribute("scale","1 1 1");
    });
  }
});

function loadNewSpotDetails(){

  //set the skybox source to the new image as per the spot
  var sky = document.getElementById("skybox");
  sky.setAttribute("src", ndata.linkto);

  var spotcomp = document.getElementById("spots");
  var currspots = nthis.parentElement.getAttribute("id");

  //create event for spots component to change the spots data
  spotcomp.emit('reloadspots',{newspots:ndata.spotgroup, currspots:currspots});
  this.emit("zoomout");
}

AFRAME.registerComponent('spot',{
  schema:{
      linkto:{type:"string",default:""},
      spotgroup:{type:"string",default:""},
  },
  init:function(){

    this.el.setAttribute("src","#hotspot");
    // this.el.setAttribute("look-at","#cam");
    this.el.setAttribute("class","clickable");
    this.el.setAttribute("scale","1.5 1.5 1.5");

    var data = this.data;
    var scene = document.querySelector('a-scene');

    this.el.addEventListener('click',function(){
      ndata = data;
      nthis = this;

      var cam = document.getElementById("cam");

      checkIfContainsQuiz(ndata.linkto)

      cam.emit("zoomin");

      scene.emit('playTransitionEffect',{data: 4});

      canMove = false;

      // Bluring animation
      setTimeout(() => {
        enabledBlur = true;
      }, 200);

      setTimeout(() => {
        blurPass.kernelSize = KernelSize.HUGE
      }, 300);

      setTimeout(() => {
        enabledBlur = false;
        blurPass.kernelSize = KernelSize.VERY_LARGE
        canMove = true;
        // console.log("CURR LOCATION", ndata.linkto)
        var locationString = ndata.linkto.replace("#room",'');
        currentRoom = parseInt(locationString);
      }, 500);
    });
  }
});

function isGoingForward(){
  if(Math.abs(cameraAngle) < 134 || Math.abs(cameraAngle) > 224) return true;
  return false;
}

function keyboardHandler(){

  document.addEventListener("keydown", (event)=>{

    if(!($('#cameraRig')[0])) return;

    var cameraRig = $('#cameraRig')[0].object3D;
    var camera = $('#cam')[0].object3D;

    if (!canMove) return;

    if(isQuizOpen()) return;

    if (event.key == 'w' || event.key == 'W' || event.key == 'ArrowUp'){

      if(isGoingForward()){
        currentRoom++;
        if(currentRoom > NUMBER_OF_ROOMS - 1) currentRoom = 0;
        $(`#room${currentRoom}F`).click();
      }  else {
        currentRoom--;
        if(currentRoom === -1) currentRoom = NUMBER_OF_ROOMS - 1;
        $(`#room${currentRoom}B`).click();
      }
    }

    var scene = document.querySelector('a-scene');

    if (event.key == 'v' || event.key == 'W'){
      scene.emit('playIntroVideo',{data: 3});
    }

    if (event.key == 's' || event.key == 'S' || event.key == 'ArrowDown'){

      if(!isGoingForward()){
        currentRoom++;
        if(currentRoom > NUMBER_OF_ROOMS - 1) currentRoom = 0;
        $(`#room${currentRoom}F`).click();
      }  else {
        currentRoom--;
        if(currentRoom === -1) currentRoom = NUMBER_OF_ROOMS - 1;
        $(`#room${currentRoom}B`).click();
      }
    }
    var code = event.keyCode || event.which;
    if (code === 13){
      if(quizOnRoomEl)quizOnRoomEl.click();
    }
  })
}

AFRAME.registerComponent('init_animations', {
  schema: {
    number_of_rooms:{default:"0"},
    start_room:{default:"#room0"},
    theme:{default:0}
  },
  init: function () {
    var ccam = document.getElementById("cam");
    var scene = document.querySelector('a-scene');
    scene.renderer.sortObjects = true

    ccam.addEventListener("animationcomplete",loadNewSpotDetails);

    var data = this.data;
    NUMBER_OF_ROOMS = data.number_of_rooms;
    THEME = data.theme;

    canMove = true;
    canRotate = true;
    quizOnRoomEl = null;
    currentRoom = 0;
    cameraAngle = 0;

    var sky = document.getElementById("skybox");
    var loadingScreen = document.getElementById("loagind_screen");
    var backGround = document.getElementById("backGround");

    startLoading(NUMBER_OF_ROOMS * IMAGE_LOAD_TIME);

    //////////////////////////////////////////
    // TO DO -> ON IMAGE LOAD, LOAD NEXT IMAGE
    //////////////////////////////////////////

    // Set every room as skybow to "warmup" the loader
    for (let i = 0; i < NUMBER_OF_ROOMS; i++) {
      setTimeout(() => {
        sky.setAttribute("src", "#room" + i);
      }, i * IMAGE_LOAD_TIME);
    }

    // Set the first room, again as skybox
    setTimeout(() => {
      sky.setAttribute("src", data.start_room);
      loadingScreen.style.display = "none";
      backGround.style.display = "none";

      var scene = document.querySelector('a-scene');
      scene.emit('playMusic',{test: 4});

      var locationString = data.start_room.replace("#room",'');
      currentRoom = parseInt(locationString);
      // keyboardHandler();

    }, NUMBER_OF_ROOMS * IMAGE_LOAD_TIME);

    // spotsPositionIndicator();

    var scene = document.querySelector('a-scene');
    var hotspot = document.createElement('a-circle');

    hotspot.setAttribute("scale","0.85 0.85 0.85");
    hotspot.setAttribute("position","0 -3 0");
    hotspot.setAttribute("rotation","-90 0 0");
    hotspot.setAttribute("color","#FF5D47");

    scene.appendChild(hotspot);

    var circle = document.createElement('a-circle');

    circle.setAttribute("scale","1.270 1.270 1.270");
    circle.setAttribute("color","#000");
    circle.setAttribute("position","0 -3.1 0");
    circle.setAttribute("rotation","-90 0 0");

    scene.appendChild(circle);

    if(THEME === -1){
      var footStartGame = document.createElement('a-image');
      footStartGame.setAttribute("id","footStartGame");
      footStartGame.setAttribute("src","#hotspot");
      footStartGame.setAttribute("position","-8.910 -3.00 -1.920");
      footStartGame.setAttribute("rotation", "-90 85.850 0");
      footStartGame.setAttribute("scale","2 2 2");
      footStartGame.setAttribute("opacity","0");

      scene.appendChild(footStartGame);
    }
  }
});

function isQuizOpen(){
  // if ((document.getElementById("quiz-quiz1")).style.display === 'block') return true;
  // if ((document.getElementById("quiz-quiz2")).style.display === 'block') return true;
  // if ((document.getElementById("quiz-words")).style.display === 'block') return true;
  // if ((document.getElementById("quiz-puzzle")).style.display === 'block') return true;
  return false;
}

function startLoading(time) {

  var progress = document.getElementById('progress')
  var counter_value = 7;

  function counterInit( fValue, lValue ) {

    counter_value++;

    if( counter_value >= fValue && counter_value <= lValue ) {
      if(document.getElementById('counter') !== null){
        document.getElementById('counter').innerHTML = counter_value + '%';
        progress.style.width = counter_value + '%';
      }
    }
  }

  for (let i = 7; i < 99; i++) {
    setTimeout(() => {
      counterInit( i, i+2 );
    }, (i * time) / 100);
  }
}

function spotsPositionIndicator(params) {
  var scene = document.querySelector('a-scene');
  var position = {x:0, y:-3, z:0}

  var father = document.createElement('a-entity');
  father.setAttribute('rotation', "0 0 0");

  for (let j = -30; j < 30; j+=0.4) {
    for (let i = -30; i < 30; i+=0.4) {
      position.x = i
      position.z = j
      var imageI1 = document.createElement('a-plane');
      imageI1.setAttribute('position', position);
      imageI1.setAttribute('material', "opacity:0.5;");
      imageI1.setAttribute('rotation', "-90 0 0");
      imageI1.setAttribute('scale', "0.4 0.4 0.4");
      imageI1.setAttribute('class', 'clickable');

      imageI1.addEventListener("click", function(){
        console.log(this.object3D.position.x.toFixed(2), this.object3D.position.y.toFixed(2), this.object3D.position.z.toFixed(2))
      })
      father.appendChild(imageI1);
    }
  }
  scene.appendChild(father);
}

/**
 * Configures a THREE.EffectComposer on the current A-Frame scene.
//  */
 AFRAME.registerSystem('effects', {
  /**
   * Configure composer with a few arbitrary passes.
   */
  init: function () {
    const sceneEl = document.querySelector('a-scene');

    if (!sceneEl.hasLoaded) {
      sceneEl.addEventListener('loaded', this.init.bind(this));
      return;
    }

    const scene = sceneEl.object3D;
    const renderer = sceneEl.renderer;
    const camera = sceneEl.camera;

    const composer = new EffectComposer(renderer);
    const pass1 = new RenderPass(scene, camera);

		blurPass = new KawaseBlurPass({
			height: 480,
      kernelSize: KernelSize.VERY_LARGE
		});

		composer.addPass(pass1);
		composer.addPass(blurPass);

    blurPass.enabled = false;

    this.composer = composer;

    this.t = 0;
    this.dt = 0;

    this.bind();
  },

  /**
   * Record the timestamp for the current frame.
   * @param {number} t
   * @param {number} dt
   */
  tick: function (t, dt) {

    this.t = t;
    this.dt = dt;

    this.composer.passes[1].enabled = enabledBlur

  },

  /**
   * Binds the EffectComposer to the A-Frame render loop.
   * (This is the hacky bit.)
   */
  bind: function () {
    const renderer = this.sceneEl.renderer;
    const render = renderer.render;
    const system = this;
    let isDigest = false;

    renderer.render = function () {
      if (isDigest) {
        render.apply(this, arguments);
      } else {
        isDigest = true;
        system.composer.render(system.dt);
        isDigest = false;
      }
    };
  }
});

AFRAME.components["look-controls"].Component.prototype.onTouchMove = function (t) {
  if (this.touchStarted && this.data.touchEnabled) {
    this.pitchObject.rotation.x += .6 * Math.PI * (t.touches[0].pageY - this.touchStart.y) / this.el.sceneEl.canvas.clientHeight;
    this.yawObject.rotation.y += /*  */ Math.PI * (t.touches[0].pageX - this.touchStart.x) / this.el.sceneEl.canvas.clientWidth;
    this.pitchObject.rotation.x = Math.max(Math.PI / -2, Math.min(Math.PI / 2, this.pitchObject.rotation.x));
    this.touchStart = {
        x: t.touches[0].pageX,
        y: t.touches[0].pageY
    }
  }
}

function checkIfContainsQuiz(nextRoom){
  quizEls.forEach(quiz => {
    if(quiz.showOn === nextRoom){
      setTimeout(() => {
        quiz.el.setAttribute('scale', '0.5 0.5 0.5'); //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        quizOnRoomEl =  quiz.el;
      }, 400);
    }
    else {
      quiz.el.setAttribute('scale', "0 0 0");
      quizOnRoomEl =  null;
    }
  });
}

var quizEls = [];

var cardsLocations = [
  {
    card1: 0,
    card2: 2,
    card3: 4,
    card4: 5
  },
  {
    card1: 0,
    card2: 2,
    card3: 4,
    card4: 6
  },
  {
    card1: 0,
    card2: 2,
    card3: 4,
    card4: 5
  },
  {
    card1: 0,
    card2: 2,
    card3: 4,
    card4: 5
  }
]

var puzzlePNGs = [
  [
    'assets/images/puzzlePieces/pc5n.png',
    'assets/images/puzzlePieces/pc2n.png',
    'assets/images/puzzlePieces/pc11n.png',
    'assets/images/puzzlePieces/pc7n.png'
  ],
  [
    'assets/images/puzzlePieces/pc3n.png',
    'assets/images/puzzlePieces/pc6n.png',
    'assets/images/puzzlePieces/pc12n.png',
    'assets/images/puzzlePieces/pc15n.png'
  ],
  [
    'assets/images/puzzlePieces/pc10n.png',
    'assets/images/puzzlePieces/pc9n.png',
    'assets/images/puzzlePieces/pc1n.png',
    'assets/images/puzzlePieces/pc13n.png'
  ],
  [
    'assets/images/puzzlePieces/pc4n.png',
    'assets/images/puzzlePieces/pc8n.png',
    'assets/images/puzzlePieces/pc14n.png',
    'assets/images/puzzlePieces/pc16n.png',
  ],
];

function getRandomNumberBetween(min,max){
  return Math.floor(Math.random()*(max-min+1)+min);
}

function CreatePiecePlaceholder(src, id, position, index){
  var circleBase = document.createElement('a-circle');

  circleBase.setAttribute("class","clickable");
  circleBase.setAttribute("id", id);
  circleBase.setAttribute("scale", (id === "QuizCard1" ? '0.5 0.5 0.5' : '0 0 0')); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  circleBase.setAttribute("position", (position) ? position : "2 1.5 0");
  circleBase.setAttribute("rotation","0 0 0");
  circleBase.setAttribute("look-at","#cam");
  circleBase.setAttribute("color","#3b3b3b");
  circleBase.setAttribute("opacity", solvedPuzzlesGlobal[index]? 0.2 : 0.4);

  if(position)
    var animationPosition2 = {
      x: position.x,
      y: position.y + 0.3,
      z: position.z,
    }
  else var animationPosition2 = {x:2, y:1.8, z:0};

  circleBase.setAttribute("animation__1", 'property: position; to:' +
    animationPosition2.x  + ' ' +
    animationPosition2.y + ' ' +
    animationPosition2.z + '; dur: 6000; dir: alternate; easing: linear; loop: true');

  var ring = document.createElement('a-ring');
  ring.setAttribute("color","#23A892");
  ring.setAttribute("id", 'ring');
  ring.setAttribute("radius-inner","1");
  ring.setAttribute("radius-outer",solvedPuzzlesGlobal[index]? 1.06 : 1);
  ring.setAttribute("opacity", solvedPuzzlesGlobal[index]? 0.5 : 1);

  if(!solvedPuzzlesGlobal[index]){
    ring.setAttribute("animation","property: geometry.radiusInner;  to: 1.2;  dur: 2000; dir: normal; easing: easeOutSine; loop: true");
    ring.setAttribute("animation__1","property: geometry.radiusOuter;  to: 1.2; dur: 2000; dir: normal; easing: easeOutQuart; loop: true");
    ring.setAttribute("animation__2","property: material.opacity;   to: 0; dur: 2000; dir: normal; easing: easeOutSine; loop: true");
  }

  var image = document.createElement('a-image');

  if(src) image.setAttribute("src", src);
  else image.setAttribute("src","assets/images/puzzlePieceDummy.png");
  image.setAttribute("position","0 0 0.02");
  image.setAttribute("scale","1 1 1");
  image.setAttribute("id", 'image');
  image.setAttribute("opacity", solvedPuzzlesGlobal[index]? 0.5 : 1);

  circleBase.appendChild(ring);
  circleBase.appendChild(image);

  return circleBase;
}
