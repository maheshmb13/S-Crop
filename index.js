console.log("From index.js");

const { BrowserWindow } = require('@electron/remote')
const {desktopCapturer,ipcRenderer} = require('electron');

var imgCropWindow;

function createScreenshotWindow(requestType){
    takeScreenshot(function(imageURL){
        var request = {
            imageURL:imageURL,
            type:requestType
        }

        imgCropWindow = new BrowserWindow({
            frame:false,
            fullscreen:true,
            show:false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            }
        })
        imgCropWindow.loadFile('mask.html').then(()=>{
            imgCropWindow.webContents.send( 'request-object',request);
        })

        imgCropWindow.once('ready-to-show', () => {
            imgCropWindow.show()
        })
    },'image/png');
}

// 1 - Mask to crop the image
// 2 - Mask to extract text

function takeScreenshot(callback, imageFormat) {
    var _this = this;
    this.callback = callback;
    imageFormat = imageFormat || 'image/jpeg';
    
    this.handleStream = (stream) => {
        // _this.callback("s")
        // Create hidden video tag
        var video = document.createElement('video');
        video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';
        
        // Event connected to stream
        video.onloadedmetadata = function () {
            // Set video ORIGINAL height (screenshot)
            video.style.height = this.videoHeight + 'px';
            video.style.width = this.videoWidth + 'px';

            video.play();
            var canvas = document.createElement('canvas');
            canvas.width = this.videoWidth;
            canvas.height = this.videoHeight;
            var ctx = canvas.getContext('2d');
            // Draw video on canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            if (_this.callback) {
                _this.callback(canvas.toDataURL(imageFormat));
                return 0;
            } else {
                console.log('Need callback!');
            }
            video.remove();
            try {
                stream.getTracks()[0].stop();
            } catch (e) {}
        }
        
        video.srcObject = stream;
        document.body.appendChild(video);
    };

    this.handleError = function(e) {
        console.log(e);
    };

    desktopCapturer.getSources({ types: ['window', 'screen'] }).then(async sources => {
        for (const source of sources) {
            // Filter: main screen
            if ((source.name === "Entire Screen") || (source.name === "Screen 1") || (source.name === "Screen 2")) {
                try{
                    console.log("so what")
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            mandatory: {
                                chromeMediaSource: 'desktop',
                                chromeMediaSourceId: source.id,
                                minWidth: 1280,
                                maxWidth: 4000,
                                minHeight: 720,
                                maxHeight: 4000
                            }
                        }
                    });
                    _this.handleStream(stream);
                } catch (e) {
                    _this.handleError(e);
                }
            }
        }
    });
}

const newMask = document.getElementById('createMask');

newMask.addEventListener('click', function(event){
    console.log("making")
    createScreenshotWindow(1);
})

var ocrMask = document.getElementById('ocrMask');

ocrMask.addEventListener('click', function(){
    console.log("making")
    createScreenshotWindow(2);
    
})

ipcRenderer.on('key-shortcut', function(args){
    console.log("making");
    createScreenshotWindow(1);
})

ipcRenderer.on('key-shortcut-ocr', function(args){
    console.log("making")
    createScreenshotWindow(2);
})

ipcRenderer.on('close-crop', function(args){
    imgCropWindow.close();
})