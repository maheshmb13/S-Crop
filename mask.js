console.log("mask.js")

const {ipcRenderer, clipboard, nativeImage} = require('electron');
const {getCurrentWindow} = require('@electron/remote');

var Tesseract = require('tesseract.js');


function blob_to_buffer(blob, callback) {
	const file_reader = new FileReader()

	file_reader.addEventListener("loadend", event => {
		if (file_reader.error) {
			callback(file_reader.error)
		} else {
			callback(null, Buffer.from(file_reader.result))
		}
	}, false)

	file_reader.readAsArrayBuffer(blob)
	return file_reader
}

var window = getCurrentWindow();


function mask(imageURL, type){
    var img = document.getElementById( "target" );
    img.src = imageURL;
    console.log("doing")
    Jcrop.load('target').then(img => {
        const stage = Jcrop.attach('target',{
            shade:true
        });
        stage.addClass('jcrop-ux-no-outline');
        console.log("done")
        console.log(stage)
        stage.listen('crop.change',function(widget,e){
            const pos = widget.pos;
            console.log(pos.x,pos.y,pos.w,pos.h);
            
            var x1 = document.getElementById("snackbarLoad");
            x1.className = "show";
            
            var cc = pos
            var image = document.getElementById( "target" );
    
            var heightScale = (image.naturalHeight/image.height)
            var widthScale = (image.naturalWidth/image.width)
    
            cc.x = cc.x * widthScale
            cc.y = cc.y * heightScale;
            cc.w = cc.w * widthScale;
            cc.h = cc.h * heightScale;
    
            var canvasElement = document.createElement("canvas");
    
            canvasElement.width = Math.floor(cc.w);
            canvasElement.height = Math.floor(cc.h);
            var ctx = canvasElement.getContext("2d");
            
            
            // console.log(image.naturalWidth, image.naturalHeight, image.width, image.height);
            ctx.drawImage(image, cc.x, cc.y, cc.w, cc.h, 0, 0, canvasElement.width, canvasElement.height);
            stage.destroy()

            var imgUrl = canvasElement.toDataURL();
            if(type==1){
                canvasElement.toBlob(function(blob){
                    blob_to_buffer(blob, async(err, buffer) => {
                        if(err)console.log("err")
                        
                        var native_image = nativeImage.createFromBuffer(buffer);        
                        await clipboard.writeImage(native_image);
    
                        var x = document.getElementById("snackbarText");
                        x.innerHTML = "Cropped image copied to clipboard..!!❤️"
                        x1.className = x1.className.replace("show", "");
                        x.className = "show";
                        setTimeout(function(){ 
                            x.className = x.className.replace("show", ""); 
                            window.close();
                        }, 1000);
                    })
                })
            }
            else if(type==2){
                var imgUrl = canvasElement.toDataURL();
                Tesseract.recognize(
                    imgUrl,
                    'eng',
                    { logger: m => console.log(m) }
                ).then(({ data: { text } }) => {
                        console.log(text);
                        clipboard.writeText(text)
                        var x = document.getElementById("snackbarText");
                        x.innerHTML = "Text copied to clipboard..!!❤️";
                        x1.className = x1.className.replace("show", "");
                        x.className = "show";
                        setTimeout(function(){ 
                            x.className = x.className.replace("show", ""); 
                            window.close();
                        }, 1000);
                })
            }
            
        })
    })
}

ipcRenderer.on('request-object', function (event, requestObject){
    var imageUrl = requestObject.imageURL;
    var type = requestObject.type;

    console.log(requestObject)
    
    if(type==1){
        mask(imageUrl,1);
    }
    else if(type==2){
        mask(imageUrl,2);
    }
});