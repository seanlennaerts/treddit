var inputImages = $('#input-images');
var inputGfycats = $('#input-gfycats');
var numImages = $('#num-images');

var port = chrome.runtime.connect({name: "background"});

function sendMessage(name, load) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        port.postMessage({name: name, load: load.trim(), tab: tabs[0].id});
        port.onMessage.addListener(function(response) {
            if (response.name == 'success') {
                inputImages.removeClass('loading');
                inputGfycats.removeClass('loading');
            }
        });
    });
}

inputImages.on('keyup', (key) => {
    if (key.keyCode === 13) {
        inputImages.addClass('loading');
        sendMessage('images', inputImages.val());
    }
});

inputGfycats.on('keyup', (key) => {
    if (key.keyCode === 13) {
        inputGfycats.addClass('loading');
        sendMessage('gfys', inputGfycats.val());
    }
});

$('#cover').click(() => {
    sendMessage('size', 'cover');
});
$('#center').click(() => {
    sendMessage('size', 'center');
});
$('#tile').click(() => {
    sendMessage('size', 'tile');
});

$('#delay-picker').change(function() {
    sendMessage('delay', $(this).val());
});