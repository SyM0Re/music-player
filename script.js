// Audio Visualizer
class AmoledWaveVisualizer {
    constructor() {
        this.circlesContainer = document.getElementById('waveCirclesContainer');
        this.particlesContainer = document.getElementById('floatingParticles');
        this.rippleContainer = document.getElementById('rippleEffects');

        this.currentAudioElement = null;
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.circles = [];
        this.animationId = null;
        this.isAnimating = false;

        this.colors = [
            '#00ffff', '#ff00ff', '#ffff00', '#ff0080',
            '#80ff00', '#0080ff', '#ff8000', '#8000ff'
        ];

        this.init();
    }

    init() {
        this.createWaveCircles();
        this.createNeonParticles();
        this.startRippleEffect();
    }

    createWaveCircles() {
        const circleCount = 8;
        this.circlesContainer.innerHTML = '';
        this.circles = [];

        for (let i = 0; i < circleCount; i++) {
            const circle = document.createElement('div');
            circle.className = 'wave-circle';
            circle.style.width = '50px';
            circle.style.height = '50px';
            circle.style.borderColor = this.colors[i];
            circle.style.filter = `drop-shadow(0 0 10px ${this.colors[i]})`;

            this.circlesContainer.appendChild(circle);
            this.circles.push(circle);
        }
    }

    createNeonParticles() {
        this.particlesContainer.innerHTML = '';
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'neon-particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 4 + 's';
            particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
            this.particlesContainer.appendChild(particle);
        }
    }

    startRippleEffect() {
        setInterval(() => {
            if (this.isAnimating) {
                this.createRipple();
            }
        }, 1500);
    }

    createRipple() {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        ripple.style.borderColor = color;
        ripple.style.filter = `drop-shadow(0 0 5px ${color})`;

        this.rippleContainer.appendChild(ripple);

        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 2000);
    }

    async setupAudioContext(audioElement) {
        try {
            if (!this.audioContext || this.currentAudioElement !== audioElement) {
                if (this.source) {
                    this.source.disconnect();
                    this.source = null;
                }

                if (!this.audioContext) {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this.analyser = this.audioContext.createAnalyser();
                    this.analyser.fftSize = 256;
                    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
                }

                this.source = this.audioContext.createMediaElementSource(audioElement);
                this.source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                this.currentAudioElement = audioElement;
            }

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            return true;
        } catch (error) {
            console.error('Audio context setup failed:', error);
            return false;
        }
    }

    async startAnimation(audioElement) {
        this.isAnimating = true;

        try {
            if (this.currentAudioElement !== audioElement) {
                await this.setupAudioContext(audioElement);
            } else if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            if (!this.animationId) {
                this.animate();
            }
        } catch (error) {
            console.error('Animation start failed:', error);
            this.fallbackAnimate();
        }

    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.resetCircles();
    }

    animate() {
        if (!this.isAnimating) {
            this.animationId = null;
            return;
        }

        if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);

            for (let i = 0; i < this.circles.length; i++) {
                const dataIndex = Math.floor(i * this.dataArray.length / this.circles.length);
                const intensity = this.dataArray[dataIndex] / 255;

                const size = 50 + (intensity * 150);
                const opacity = 0.3 + (intensity * 0.7);
                const borderWidth = 1 + (intensity * 4);

                this.circles[i].style.width = size + 'px';
                this.circles[i].style.height = size + 'px';
                this.circles[i].style.opacity = opacity;
                this.circles[i].style.borderWidth = borderWidth + 'px';

                if (intensity > 0.7) {
                    this.circles[i].style.filter = `drop-shadow(0 0 ${20 * intensity}px ${this.colors[i]})`;
                } else {
                    this.circles[i].style.filter = `drop-shadow(0 0 10px ${this.colors[i]})`;
                }
            }
        } else {
            this.fallbackAnimate();
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    fallbackAnimate() {
        const time = Date.now() * 0.001;
        for (let i = 0; i < this.circles.length; i++) {
            const size = 50 + Math.sin(time + i * 0.5) * 50 + 50;
            const opacity = 0.4 + Math.sin(time + i * 0.3) * 0.3;
            const borderWidth = 2 + Math.sin(time + i * 0.7) * 2;

            this.circles[i].style.width = size + 'px';
            this.circles[i].style.height = size + 'px';
            this.circles[i].style.opacity = opacity;
            this.circles[i].style.borderWidth = borderWidth + 'px';
        }
    }

    resetCircles() {
        this.circles.forEach(circle => {
            circle.style.width = '50px';
            circle.style.height = '50px';
            circle.style.opacity = '0.4';
            circle.style.borderWidth = '2px';
        });
    }

    onResize() {
        this.createWaveCircles();
        this.createNeonParticles();
    }
}

const amoledVisualizer = new AmoledWaveVisualizer();

window.addEventListener('resize', () => {
    amoledVisualizer.onResize();
});



//Main Code
let audio = null;
let playingsong = 0;
let count = 0;
let songs = [];
async function getsongs() {

    //Folder Path
    let folder = "./songs/";
    let res = "";
    try {
        res = await fetch(folder);
    } catch (error) {
        console.log(error, "folder error");
    }

    let response = await res.text();

    // Creating div to store the response
    let div = document.createElement("div");
    div.innerHTML = response;


    //getting all the anchor tags
    let as = div.getElementsByTagName("a");

    //getting the dom element (song card container)
    let ul = document.querySelector(".library-main").querySelector("ul");

    //Iterating over the list of anchor tags to get mp3
    for (let i = 0; i < as.length; i++) {
        if (as[i].href.endsWith(".mp3") || as[i].href.endsWith(".m4a")) {

            //Storing the hyperlinks in songs list
            songs.push(as[i].href)
            console.log(as[i].href);

            //Formating the the songs info
            let ele = as[i].href.split("/")[3].split(".mp3")[0].replaceAll("%20", " ").replaceAll("%", " ");
            console.log(ele);
            ele = ele.slice(0, -4);
            let Artists = ele.split("-")[0];
            ele = ele.split("-")[1];

            //Creating the song cards
            let li = document.createElement("li");
            li.className = "playablesong";
            li.id = `${count}`;
            li.innerHTML = `<img src="svgs/music-note-square-01-stroke-rounded.svg" alt="Music">
                                    <div class="lis flex">
                                    <div class="title-song">${ele}</div>
                                    <div class="artist-song">${Artists}</div>`;
            count++;

            //Click event on song cards
            li.addEventListener('click', function () {
                ifaudio(playingsong);
                playingsong = li.id;
                assign(playingsong);
                audio.play();
                changeToPause();
            });

            //Updating the Dom element
            ul.appendChild(li);
        }
    }
}

//Function to convert seconds to minutes
function secondsToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "0:00";
    }
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);
    let formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    return `${minutes}:${formattedSeconds}`;
}

//Function to play button to pause
function changeToPause() {
    document.querySelector(".play").children[0].setAttribute("src", "images/pause.png");
}

//function to assing song to particular index;
function assign(playingsong) {

    //getting the song from the song card
    let text = document.getElementById(playingsong).querySelector(".title-song").innerHTML;
    document.querySelector(".songinfo").children[0].innerHTML = text;

    //stopping the current audio animation
    amoledVisualizer.stopAnimation();

    //assinging the new song
    audio = new Audio(songs[playingsong]);

    //reseting the the circle position when audio is ended
    audio.addEventListener("ended", () => {
        document.querySelector(".circle").style.left = "0%";
        amoledVisualizer.stopAnimation();

        //playing the next song when current song ends
        handleNextClick()
    });

    //setting up the volume for the current audio
    audio.volume = document.querySelector('.volume-slider').value;

    //changing the focus on song card
    let temp = document.getElementById(`${playingsong}`);
    temp.children[0].style.filter = "brightness(0) invert(1)";
    temp.style.color = "White";

    //Updating the current song timings on the dom
    audio.addEventListener("timeupdate", () => {
        let a = secondsToMinutes(audio.currentTime);
        document.querySelector(".currenttime").innerHTML = a;
        a = secondsToMinutes(audio.duration);
        document.querySelector(".duration").innerHTML = a;
        let progressPercent = (audio.currentTime / audio.duration) * 100;
        progressPercent = Math.max(0, Math.min(100, progressPercent));
        document.querySelector(".circle").style.left = progressPercent + "%";
    });

    //handling teh animation (play and pause)
    audio.addEventListener("play", () => {
        amoledVisualizer.startAnimation(audio);
    });

    audio.addEventListener("pause", () => {
        amoledVisualizer.stopAnimation();
    });
}

//function to check if there is audio , stop the current audio , reset the focus on song card
function ifaudio(playingsong) {
    if (audio) {
        audio.pause();

        //stopping the current audio animation
        amoledVisualizer.stopAnimation();

        //resseting the focus on song card
        let temp = document.getElementById(`${playingsong}`);
        if (temp != null) {
            temp.style.color = "";
            temp.children[0].style.filter = "";
        }
    }
}

//next button
function handleNextClick() {
    if (playingsong >= 0) {
        ifaudio(playingsong);

        //getting the index of next song
        playingsong = (playingsong + 1) % count;
        assign(playingsong);
        audio.play();
        changeToPause();
    }
}

//previous button
function handlePrevClick() {
    ifaudio(playingsong);

    if (playingsong > 0) {
        playingsong--;
    } else {
        playingsong = songs.length - 1;
    }

    // assing the previous audio from the song list
    assign(playingsong);
    audio.play();
    changeToPause();
}

//play button
function playsong() {
    if (audio) {
        playbutton()
    } else {
        assign(0);
        playbutton();
    }
}

//handling play button
function playbutton() {
    if (document.querySelector(".play").children[0].src.endsWith("images/play.png")) {
        changeToPause()
        audio.volume = document.querySelector('.volume-slider').value;
        document.querySelector(".volume img").setAttribute("style", "filter: brightness(0) invert(0.9)");
        audio.play();
    } else {
        document.querySelector(".play").children[0].setAttribute("src", "images/play.png");
        document.querySelector(".volume img").setAttribute("style", "filter: brightness(0) invert(0.5)");
        audio.pause();
    }
}

//play btn
document.querySelector(".play").addEventListener("click", playsong);
//Next btn
document.querySelector(".next").addEventListener("click", handleNextClick);
//Previous btn
document.querySelector(".previous").addEventListener("click", handlePrevClick);

//exiting the full screen
function fullscreenexit() {
    const temp = document.querySelector('.amoled-visualizer');

    if (!document.fullscreenElement) {
        temp.classList.remove('fullscreen-mode');
        temp.style.border = "";
    }
}

function exitFullscreenOnInteraction() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
}

//seekbar functionality
document.querySelector(".playbar").addEventListener("click", ele => {
    if (audio) {

        //getting location on users click
        let temp = (ele.offsetX / ele.target.getBoundingClientRect().width) * 100;
        //move the playbar circle
        document.querySelector(".circle").style.left = temp + "%";
        //updating the time
        audio.currentTime = ((audio.duration * temp) / 100)
    }
})




//handling the humburger functionlity

let leftMain = document.querySelector(".left-main");
let leftslide = document.querySelector(".leftslide");
let rightslide = document.querySelector(".rightslide");

leftslide.addEventListener("click", () => {
    leftslide.classList.remove("glow-button");
    leftMain.style.width = "50%";
    leftMain.style.paddingBottom = "1em";
    leftMain.style.height = "98%";
    leftMain.style.position = "absolute";
    leftMain.style.left = "-100%";
});

rightslide.addEventListener("click", () => {
    if (leftMain.style.position == "absolute") {
        leftMain.style.left = "9px";
    }
});

//changing the volume button when slider reaches 0
document.querySelector('.volume-slider').addEventListener('input', (e) => {
    if (e.target.value <= 0.01) {
        document.querySelector('.volume img').src = "svgs/mute.svg";
    } else {
        document.querySelector('.volume img').src = "svgs/volume.svg";
    }
    if (audio) audio.volume = e.target.value;
});

//chaning the volume button when clicked
document.querySelector('.volume img').addEventListener('click', (e) => {
    let value = 0;
    if (e.target.src.endsWith("volume.svg")) {
        e.target.src = "svgs/mute.svg";
    } else {
        e.target.src = "svgs/volume.svg";
        value = 1;
    }
    document.querySelector('.volume-slider').value = value;
    if (audio) audio.volume = value;
});

let fullscreen = document.querySelector(".full-screen");
//double click on the audio visuailizer
document.querySelector(".amoled-visualizer").addEventListener("dblclick", () => {
    if (!document.fullscreenElement) {
        console.log("hello");
        Fullscreen();
    } else {
        document.exitFullscreen();
    }
});

//function to go fullscreen
function Fullscreen() {
    let temp = document.querySelector(".amoled-visualizer");
    if (!document.fullscreenElement) {
        temp.requestFullscreen().then(() => {
            temp.classList.add('fullscreen-mode');
            temp.style.border = "0";
        }).catch(err => {
            console.error('Error entering fullscreen:', err);
        });
    } else {
        temp.style.border = "";
        document.exitFullscreen();
    }
}


fullscreen.addEventListener("click", Fullscreen)
//handling fullscreen interactions
document.addEventListener('fullscreenchange', fullscreenexit);
// document.addEventListener('click', exitFullscreenOnInteraction);

//mobile interaction in fullscreen
document.addEventListener('touchstart', exitFullscreenOnInteraction);

//keeping spacebar functionality in fullscreen
document.addEventListener('keydown', (e) => {
    let temp = e.code;
    if (temp != "Space" && temp != "ArrowRight" && temp != "ArrowLeft") exitFullscreenOnInteraction();
});

//Arrow btns functionality
function controlBtns(e) {
    // e.preventDefault();
    if (e.code === "Space") {
        playsong();
    } else if (e.code == "ArrowRight") {
        handleNextClick()
    } else if (e.code == "ArrowLeft") {
        handlePrevClick()
    }
}
document.addEventListener("keydown", (e) => controlBtns(e))
// getting the songs from the folder
async function main() {
    let a = await getsongs();
}

main();