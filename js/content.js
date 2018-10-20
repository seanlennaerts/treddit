
var body = $('#classic-body');
body.css('transition', 'background 0s linear 2s');
body.prepend(`<div id="video-root"></div>\n<div id="credit" style="position: absolute;
left: 2rem;
bottom: 2rem;
font-size: 1.5rem;
opacity: 0.5;"><a style="text-decoration:none; color: white;" href="" target="_blank"></a></div>`);

var backgroundPort;

chrome.runtime.onConnect.addListener(function (port) {
    backgroundPort = port;
    console.log(port.name);
    port.onMessage.addListener(function (msg) {
        switch (msg.name) {
            case 'image':
                changeImage(msg.load.url);
                updateCredit(msg.load.author, msg.load.link);
                break;
            case 'gfy':
                changeGfy(msg.load.url);
                updateCredit(msg.load.author, msg.load.link);
                break;
            case 'size':
                changeSize(msg.load);
                break;
        }
    });
});

function changeImage(imageUrl) {
    $('#video-root').empty();
    console.log(`changing background to ${imageUrl}`);
    body.css('background-image', `url(${imageUrl})`);
}

function changeGfy(gfyUrl) {
    console.log(`chaging gfy to ${gfyUrl}`);
    $('#video-root').prepend(`<video autoplay muted loop class="treddit-video" style="position:absolute; width:100%; height:100%; object-fit:cover"><source src="${gfyUrl}" type="video/webm"></video>`);
    if ($('.treddit-video').length > 1) {
        $('.treddit-video')[1].remove();
    }
}

function updateCredit(author, link) {
    //needs to be delayed by 2s to match the image change delay
    $('#credit').find('a').attr('href', link).html(`u/${author}`);
}

function changeSize(size) {
    switch (size) {
        case 'center':
            body.css({
                'background-size': 'contain',
                'background-repeat': 'no-repeat',
            });
            break;
        case 'tile':
            body.css({
                'background-size': 'contain',
                'background-repeat': '',
            });
            break;
        case 'cover':
            body.css({
                'background-size': 'cover',
                'background-repeat': '',
            });
            break;
    }
}

