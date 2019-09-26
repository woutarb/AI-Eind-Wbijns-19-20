var webcamStream;
var imageTaken = document.getElementById('sourceImage');
var imagePNG;
var BASE64_MARKER = ';base64,';

// Startwebcam, takesnap, stopwebcam are from a zip out of Slack from Sonja Rouwhorst. ConvertData from https://stackoverflow.com/questions/4998908/convert-data-uri-to-file-then-append-to-formdata#5100158 . Processimage and showresults are from the MS azure quickstart for printed text vision https://docs.microsoft.com/nl-nl/azure/cognitive-services/Computer-vision/quickstarts/javascript-print-text Dice are printed text after all, so I thought it'd be more accurate than the written text version

// Function needed to start webcam and allow the making of snappictures
function startWebcam() {
	var vid = document.querySelector('video');
    // request cam
    navigator.mediaDevices.getUserMedia({
		video: true
    })
    .then(stream => {
		// save stream to variable at top level so it can be stopped lateron
        webcamStream = stream;
        // show stream from the webcam on te video element
        vid.srcObject = stream;
        // returns a Promise to indicate if the video is playing
        return vid.play();
    })
    
    .then(() => {
		// enable the 'take a snap' button
        var btn = document.querySelector('#takeSnap');
        btn.disabled = false;
        // when clicked
        btn.onclick = e => {
			takeSnap()
          };
    })
    .catch(e => console.log('error: ' + e));
    }

//Taking pictures, storing it in a variable and activating processing
function takeSnap() {
	// get video element
    var vid = document.querySelector('video');
    // get canvas element
    var canvas = document.querySelector('canvas');
    // get its context
    var ctx = canvas.getContext('2d');
    // set its size to the one of the video
    canvas.width = vid.videoWidth;
    canvas.height = vid.videoHeight;
    // show snapshot on canvas
    ctx.drawImage(vid, 0, 0);
	return new Promise((res, rej) => {
      // request a Blob from the canvas
    canvas.toBlob(res, 'image/jpeg');
	imagePNG = canvas.toDataURL("image/png");
    processImage();
	});
}

// Stopping the webcam from working
function stopWebcam() {
	var vid = document.querySelector('video');
    vid.srcObject.getTracks().forEach((track) => {
		track.stop();
    });
    // disable snapshot button
    document.querySelector('#takeSnap').disabled = true;
    }

// Needed to be able to process the snap made
function convertDataURIToBinary(dataURI) {
var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
var base64 = dataURI.substring(base64Index);
var raw = window.atob(base64);
var rawLength = raw.length;
var array = new Uint8Array(new ArrayBuffer(rawLength));

for(let i = 0; i < rawLength; i++) {
array[i] = raw.charCodeAt(i);
}
return array;
}

// Processing the image
function processImage() {
	let subscriptionKey = '';
    let endpoint = '';
	// If there isn't a key, this is not going to work
    if (!subscriptionKey){ 
		throw new Error('Fix your environment variabeles for key and endpoint.'); 
	}    
    	var uriBase = endpoint + "vision/v2.0/ocr";
	
        // Request parameters.
        var params = {
            "language": "unk",
            "detectOrientation": "true",
        };

        // Display the image.
        var sourceImageUrl = imagePNG;
        document.querySelector("#sourceImage").src = sourceImageUrl;
        // Make the REST API call.
        $.ajax({
            url: uriBase + "?" + $.param(params),

            // Request headers.
            beforeSend: function(xhrObj){
                xhrObj.setRequestHeader("Content-Type","application/octet-stream")
                xhrObj.setRequestHeader(
                    "Ocp-Apim-Subscription-Key", subscriptionKey);
            },

            type: "POST",

            // Request body.
            data: convertDataURIToBinary(sourceImageUrl),
			processData: false
        })

        .done(function(data) {
            // Show formatted JSON on webpage.
            $("#responseTextArea").val(JSON.stringify(data, null, 2));
        })

        .fail(function(jqXHR, textStatus, errorThrown) {
            // Display error message.
            var errorString = (errorThrown === "") ? "Error. " :
                errorThrown + " (" + jqXHR.status + "): ";
            errorString += (jqXHR.responseText === "") ? "" :
                jQuery.parseJSON(jqXHR.responseText).message;
            alert(errorString);
        });
};

//Showing the results in JSON. 
function showResults(json) {
	// show results in responseArea
    document.querySelector('#responseArea').textContent = JSON.stringify(json, null, 2);
}