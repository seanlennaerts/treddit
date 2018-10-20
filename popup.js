var inputImages = $('#input-images');
var inputGfycats = $('#input-gfycats');
var numImages = $('#num-images');

var port;

inputImages.on('keyup', (key) => {
    if (key.keyCode === 13) {        
        port = chrome.runtime.connect({name: "background"});

        
        inputImages.addClass('loading');
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            console.log('sending request to background');
            console.log(tabs[0].id);
            port.postMessage({name: 'images', load: inputImages.val(), type: false, tab: tabs[0].id});
        });
        port.onMessage.addListener(function(msg) {
            if (msg.name === 'success') {
                console.log('success!');
                inputImages.removeClass('loading');
            }
        });
    }
});

inputGfycats.on('keyup', (key) => {
    if (key.keyCode === 13) {        
        port = chrome.runtime.connect({name: "background"});

        inputGfycats.addClass('loading');
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            console.log('sending request to background');
            console.log(tabs[0].id);
            port.postMessage({name: 'gfys', load: inputGfycats.val(), type: true, tab: tabs[0].id});
        });
        port.onMessage.addListener(function(msg) {
            if (msg.name === 'success') {
                console.log('success!');
                inputGfycats.removeClass('loading');
            }
        });
    }
});

function selectSize(size) {
    sendMessage('size', size);
}

$('#cover').click(() => {
    sendMessage('size', 'cover');
});
$('#center').click(() => {
    sendMessage('size', 'center');
});
$('#tile').click(() => {
    sendMessage('size', 'tile');
});

