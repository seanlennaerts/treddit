'use strict';

var time;
var urls = { subreddit: '', urls: [] };
var imageDelay = 5;

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


chrome.runtime.onConnect.addListener(function (popupPort) {
    popupPort.onMessage.addListener(function (request) {
        contentPort = chrome.tabs.connect(request.tab, { name: 'contentPort' });

        switch (request.name) {
            //TODO: must refactor these two cases together
            case 'images': {
                clearTimeout(time);
                urls.subreddit = request.load;
                urls.urls = [];
                sendImage(contentPort);
                getListingsFromSubreddit(request.load, '', { gfy: false, image: true })
                    .catch((err) => console.log(err))
                    .finally(() => {
                        //when first page returns we know we have some data at least
                        clearTimeout(time);
                        sendImage(contentPort);
                        try {
                            popupPort.postMessage({ name: 'success' })
                        } catch (err) {
                            console.log('User must have closed the popup')
                        }
                    });
                break;
            }
            case 'gfys': {
                clearTimeout(time);
                urls.subreddit = request.load;
                urls.urls = [];
                sendGfy(contentPort);
                getListingsFromSubreddit(request.load, '', { gfy: true, image: false })
                    .catch((err) => console.log(err))
                    .finally(() => {
                        //when first page returns we know we have some data at least
                        clearTimeout(time);
                        sendGfy(contentPort);
                        try {
                            popupPort.postMessage({ name: 'success' })
                        } catch (err) {
                            console.log('User must have closed the popup')
                        }
                    });
                break;
            }
            case 'size': {
                contentPort.postMessage({ name: 'size', load: request.load });
                break;
            }
            case 'delay': {
                console.log(`updating delay to ${request.load}`);
                imageDelay = parseInt(request.load);
                break;
            }
        }
    });
});

function sendImage(contentPort) {
    let curr = urls.urls;
    if (curr.length > 0) {
        const rand = getRandomInt(0, curr.length - 1);
        console.log(`ready to send ${curr[rand]}`);
        contentPort.postMessage({ name: 'image', load: curr[rand] });
        time = setTimeout(sendImage.bind(null, contentPort), imageDelay * 1000);
    } else {
        console.log('found nothing so timing out for 1 sec');
        time = setTimeout(sendImage.bind(null, contentPort), 1000);
    }
}

async function sendGfy(contentPort) {
    let curr = urls.urls;
    if (curr.length > 0) {
        const rand = getRandomInt(0, curr.length - 1);
        const gfyItem = await getGfyInfo(curr[rand].url);
        curr[rand].url = gfyItem.webmUrl;
        contentPort.postMessage({ name: 'gfy', load: curr[rand] });
        const videoLength = Math.floor(gfyItem.numFrames / gfyItem.frameRate);
        time = setTimeout((await sendGfy).bind(null, contentPort), videoLength * 1000);
    } else {
        console.log('found nothing so timing out for 1 sec');
        time = setTimeout(sendGfy.bind(null, contentPort), 1000);
    }
}

// recursively get listings from subreddit ======================================
async function getListing(sub, after) {
    console.log(`getting list from https://www.reddit.com/${sub}.json?limit=100&after=${after}`);
    return (await getRequest(`https://www.reddit.com/${sub}.json?limit=100&after=${after}`)).data;
}

async function getListingsFromSubreddit(sub, after, filter) {
    const listing = await getListing(sub, after);
    //TODO: the line below is actually problematic because could make gfy request after image request and the subs will still match
    if (sub === urls.subreddit) { //if false then this result is no longer valid, i.e. user has made new request subreddit 
        urls.urls = urls.urls.concat(filterUrls(listing.children, filter));
        if (listing.after) {
            getListingsFromSubreddit(sub, listing.after, filter);
        }
    }
}

/* 
 * filter object:
 * {
 *   gfy: bool,
 *   image: bool
 * }
 */

function filterUrls(children, filter) {
    const filtered = [];
    for (let i = 0; i < children.length; i++) {
        if (filter.gfy) {
            if (children[i].data.domain != null && children[i].data.domain.startsWith('gfy')) {
                // filtered.push(children[i].data.url);
                filtered.push({ url: children[i].data.url, author: children[i].data.author, link: `https://www.reddit.com${children[i].data.permalink}` });
                continue;
            }
        }
        if (filter.image) {
            if (children[i].data.post_hint != null && children[i].data.post_hint.startsWith('i')) {
                filtered.push({ url: children[i].data.url, author: children[i].data.author, link: `https://www.reddit.com${children[i].data.permalink}` });
                continue;
            }
        }
    }
    return filtered;
}
// ============================================================================
