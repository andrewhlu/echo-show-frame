var mainDiv = document.getElementById('mainDiv');
var timeField = document.getElementById('timeField');
var dateField = document.getElementById('dateField');
var imageDiv = document.getElementById('images');
var captionText = document.getElementById('caption');
var settingsMenu = document.getElementById("settingsMenu");
var blackout = document.getElementById("blackout");
var audioElement = document.getElementById("musicElement");
var ipDisplayElement = document.getElementById("ip-display");

var addrs = {
    "0.0.0.0": false
};

// Functions to control state of frame
var frameConfig = {
    contents: {
        time: 1,
        date: 1,
        media: 1,
        settings: 0,
        caption: 0
    },
    image: {
        source: "Reddit",
        subreddit: "r/EarthPorn",
        rate: 3600
    }
};

function goFullScreen() {
    mainDiv.requestFullscreen();

    audioElement.volume = 0;
    audioElement.play();

    setTimeout(() => {
        setInterval(() => {
            audioElement.currentTime = 5.058;
        }, 41790);
    }, 5058);
}

// Functions to control date and time
function updateTime() {
    var currentTime = new Date();

    var monthArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var weekdayArray = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    var month = monthArray[currentTime.getMonth()];
    var day = currentTime.getDate();
    var weekday = weekdayArray[currentTime.getDay()];
    var hour = currentTime.getHours();
    var minute = currentTime.getMinutes();

    if(frameConfig.contents.time == 1) {
        if(hour == 0) {
            hour = 12;
        }
        else if (hour > 12) {
            hour -= 12;
        }
    }

    if(minute < 10) {
        minute = "0" + minute;
    }

    timeField.innerHTML = hour + ":" + minute;
    dateField.innerHTML = weekday + ", " + month + " " + day;
}

updateTime();
setInterval(updateTime, 1000);

// Functions to open and close settings menu
function openSettings() {
    settingsMenu.classList.remove("fadeout-animation");
    settingsMenu.classList.add("fadein-animation");
    settingsMenu.removeAttribute("hidden");
}

function closeSettings() {
    settingsMenu.classList.remove("fadein-animation");
    settingsMenu.classList.add("fadeout-animation");
    setTimeout(function() {
        settingsMenu.setAttribute("hidden", true);
    }, 450);
}

// Reddit
function getBackgroundImage() {
    var http = new XMLHttpRequest();
    var redditUrl = "https://alu.moe/api/frame/reddit?subreddit=" + frameConfig.image.subreddit;
    http.open("GET", redditUrl, true);
    http.send();

    http.onreadystatechange = function(e) {
        if(this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(http.responseText);
            if(response.success) {
                var url = response.url;
                var title = response.title;

                // URL must be from "i.redd.it" domain in order for us to get direct image URL
                if(url.includes("i.redd.it")) {
                    setBackgroundImage(url, title);
                }
                else {
                    getBackgroundImage();
                }
            }
        }
    }
}

// Function to set a new background image
function setBackgroundImage(url, title) {
    var images = imageDiv.getElementsByTagName('img');

    // First, append the new image, hidden.
    var newImage = document.createElement("img");
    newImage.onload = function () {
        if(frameConfig.contents.caption === 1) {
            captionText.innerHTML = "Image: " + title;
            captionText.hidden = false;
        }
        else {
            captionText.hidden = true;
        }
        
        newImage.classList.add("fadein-animation-2s");
        newImage.hidden = false;
        
        // Then, remove the old image.
        setTimeout(function() {
            var images = imageDiv.getElementsByTagName('img');
            if(images.length > 1) {
                images[0].remove();
            }
        }, 2000);
    }
    newImage.src = url;
    newImage.alt = title;
    newImage.hidden = true;
    imageDiv.appendChild(newImage);
}

getBackgroundImage();
setInterval(function() {
    getBackgroundImage();
}, frameConfig.image.rate * 1000);

// Function to blackout screen
function hideFrame() {
    blackout.hidden = false;
}

function showFrame() {
    blackout.hidden = true;
}

function showDeviceIP() {
    if (!!ipDisplayElement) {
        if (Object.keys(addrs).filter((a) => addrs[a]).length > 0) {
            ipDisplayElement.innerHTML = Object.keys(addrs).filter((a) => addrs[a])[0];
        } else {
            ipDisplayElement.innerHTML = "Could not get device internal IP address";
        }
    }
}

// NOTE: window.RTCPeerConnection is "not a constructor" in FF22/23
var RTCPeerConnection = /*window.RTCPeerConnection ||*/ window.webkitRTCPeerConnection || window.mozRTCPeerConnection;

if (RTCPeerConnection) (function () {
    var rtc = new RTCPeerConnection({iceServers:[]});
    if (1 || window.mozRTCPeerConnection) {      // FF [and now Chrome!] needs a channel/stream to proceed
        rtc.createDataChannel('', {reliable:false});
    };
    
    rtc.onicecandidate = function (evt) {
        // convert the candidate to SDP so we can run it through our general parser
        // see https://twitter.com/lancestout/status/525796175425720320 for details
        if (evt.candidate) grepSDP("a="+evt.candidate.candidate);
    };
    rtc.createOffer(function (offerDesc) {
        grepSDP(offerDesc.sdp);
        rtc.setLocalDescription(offerDesc);
    }, function (e) { console.warn("offer failed", e); });

    function updateDisplay(newAddr) {
        console.log("updateDisplay called with addr", newAddr);
        if (newAddr in addrs) return;
        else if (!newAddr.match(/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/g)) return;
        else addrs[newAddr] = true;
        // console.log(Object.keys(addrs).filter((a) => addrs[a]));
        showDeviceIP();
    }
    
    function grepSDP(sdp) {
        sdp.split('\r\n').forEach(function (line) { // c.f. http://tools.ietf.org/html/rfc4566#page-39
            if (~line.indexOf("a=candidate")) {     // http://tools.ietf.org/html/rfc4566#section-5.13
                var parts = line.split(' '),        // http://tools.ietf.org/html/rfc5245#section-15.1
                    addr = parts[4],
                    type = parts[7];
                if (type === 'host') updateDisplay(addr);
            } else if (~line.indexOf("c=")) {       // http://tools.ietf.org/html/rfc4566#section-5.7
                var parts = line.split(' '),
                    addr = parts[2];
                updateDisplay(addr);
            }
        });
    }
})()
