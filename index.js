var mainDiv = document.getElementById('mainDiv');
var timeField = document.getElementById('timeField');
var dateField = document.getElementById('dateField');
var imageDiv = document.getElementById('images');
var captionText = document.getElementById('caption');
var settingsMenu = document.getElementById("settingsMenu");
var blackout = document.getElementById("blackout");

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
        rate: 60
    }
};

function goFullScreen() {
    mainDiv.requestFullscreen();
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
