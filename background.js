var time;
// to activiate button only on trello board pages
chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: [
                    new chrome.declarativeContent.PageStateMatcher({
                        pageUrl: { urlContains: 'trello.com/b' },
                    })
                ],
                actions: [new chrome.declarativeContent.ShowPageAction()]
            }
        ]);
    });
});

// =============================Utilities======================================
function getRequest(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.onload = () => {
            if (xhr.status == 200) {
                resolve(xhr.response);
            } else {
                reject(xhr.status);
            }
        }
        xhr.timeout = 5000;
        xhr.ontimeout = () => reject('timeout');
        xhr.open('GET', url);
        xhr.send();
    });
}

async function getGfyInfo(url) {
    console.log(`getting info from https://api.gfycat.com/v1/gfycats/${url.split('/').pop()}`)
    return (await getRequest(`https://api.gfycat.com/v1/gfycats/${url.split('/').pop()}`)).gfyItem; //set content type to json?
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// ============================================================================
var contentPort;
chrome.runtime.onConnect.addListener(function (port) {

    //connec to contentscript
    // contentPort = chrome.tabs.connet(port.tab, {name: 'content'});


    port.onMessage.addListener(function (msg) {

        contentPort = chrome.tabs.connect(msg.tab, {name: 'contentPort'});
        console.log(contentPort.name);
        clearTimeout(time);
        switch (msg.name) {
            case 'images': {
                console.log(`got request for images from ${msg.load}`);
                getListingsFromSubreddit(msg.load, '', msg.type)
                    .then((result) => {
                        sendImage(result, contentPort);
                    })
                    .catch((err) => console.log(err))
                    .finally(() => {
                        try {
                            port.postMessage({ name: 'success' })
                        } catch(err) {
                            console.log('User must have closed the popup')
                        }
                    });
                break;
            }
            case 'gfys': {
                console.log(`got request for images from ${msg.load}`);
                getListingsFromSubreddit(msg.load, '', msg.type)
                    .then((result) => {
                        sendGfy(result, contentPort);
                    })
                    .catch((err) => console.log(err))
                    .finally(() => {
                        try {
                            port.postMessage({ name: 'success' })
                        } catch(err) {
                            console.log('User must have closed the popup')
                        }
                    });
                break;
            }
        }
    });
});

function sendImage(imageUrls, contentPort) {
    // let contentPort = chrome.tabs.connect(msg.tab, {name: 'contentPort'});
    const randInt = getRandomInt(0, imageUrls.length - 1);
    console.log(`ready to send ${imageUrls[randInt]}`);
    contentPort.postMessage({ name: 'image', load: imageUrls[randInt] });
    time = setTimeout(sendImage.bind(null, imageUrls, contentPort), 7000);
}

async function sendGfy(gfyUrls, contentPort) {
    const randInt = getRandomInt(0, gfyUrls.length - 1);
    const gfyItem = await getGfyInfo(gfyUrls[randInt]);
    contentPort.postMessage({ name: 'gfy', load: gfyItem.webmUrl });
    const videoLength = Math.floor(gfyItem.numFrames / gfyItem.frameRate);
    time = setTimeout((await sendGfy).bind(null, gfyUrls, contentPort), videoLength * 1000);
}

// recursively get listings from subreddit ======================================
async function getListing(sub, after) {
    console.log(`getting list from https://www.reddit.com/${sub}.json?limit=100&after=${after}`);
    return (await getRequest(`https://www.reddit.com/${sub}.json?limit=100&after=${after}`)).data;
}

async function getListingsFromSubreddit(sub, after, gfy) {
    const fragment = await getListing(sub, after);
    if (fragment.after) {
        return filterChildren(fragment.children, gfy).concat(await getListingsFromSubreddit(sub, fragment.after));
    } else {
        return filterChildren(fragment.children, gfy);
    }
}

function filterChildren(children, gfy) {
    var urls = [];
    for (let i = 0; i < children.length; i++) {
        if (gfy) {
            if (children[i].data.domain != null && children[i].data.domain.startsWith('gfy')) {
                urls.push(children[i].data.url);
            }
        } else {
            if (children[i].data.post_hint != null && children[i].data.post_hint.startsWith('i')) {
                urls.push(children[i].data.url);
            }
        }
    }
    return urls;
}
// ============================================================================
