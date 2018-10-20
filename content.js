
var body = $('#classic-body');
var time;
// var imageUrls;
var backgroundPort;

chrome.runtime.onConnect.addListener(function(port) {
    backgroundPort = port;
    console.log(port.name);
    port.onMessage.addListener(function(msg) {
        switch (msg.name) {
            case 'image':
                console.log('changing image');
                changeImage(msg.load);
                break;
            case 'gfy':
                changeGfy(msg.load);
                break;
            case 'size':
                changeSize(msg.load);
                break;
        }
    });
}
    // function (request, sender, sendResponse) {
    //     switch (request.name) {
    //         case 'imageUrls':
    //             clearTimeout(time);
    //             showWebm(request.load);
    //             break;
    //         case 'size':
    //             switch (request.load) {
    //                 case 'center':
    //                     body.css({
    //                         'background-size' : 'contain',
    //                         'background-repeat' : 'no-repeat',
    //                     });
    //                     break;
    //                 case 'tile':
    //                     body.css({
    //                         'background-size' : 'contain',
    //                         'background-repeat' : '',
    //                     });
    //                     break;
    //                 case 'cover':
    //                     body.css({
    //                         'background-size' : 'cover',
    //                         'background-repeat' : '',
    //                     });
    //                     break;
                    

    //             }
    //             break;
                
    //     }
    // }
);

function changeImage(imageUrl) {
    console.log(`changing background to ${imageUrl}`);
    body.css('background-image', `url(${imageUrl})`);
}

function changeGfy(gfyUrl) {
    console.log(`chaging gfy to ${gfyUrl}`);
    $('#video-root').after(`<video autoplay muted loop class="treddit-video" style="position:absolute; width:100%; height:100%; object-fit:cover"><source src="${gfyUrl}" type="video/webm"></video>`);
    if ($('.treddit-video').length > 1) {
        $('.treddit-video')[1].remove();
    }
}

body.css('transition', 'background 0s linear 2s');
body.prepend(`<div id="video-root"></div>`);