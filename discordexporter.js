//For each message, map it to a JSON object by do the following:
// Find the child element with a class that contains the substring "searchResult"
// In that child, find the child element with a class that contains the substring "message"
//In that child, find the first child element
//In that child, find the child element with a class that contains the substring "content". Call that child contentChild

//In contentChild, find the child element with class that contains the substring "message-content". Store its innerText
//in a property called "messageContent" in the JSON object

//In contentChild, find the child element with class that contains the substring "header". Call that child headerChild
//In headerChild, find the child element with id that contains the substring "message-username".
//In that child, find the first child element and store its innerText in a property called "username" in the JSON object

//In headerChild, find the child element with class that contains the substring "timestamp".
//In that child, find the first child element and store the value of the "datetime" attribute in a property called "timestamp" in the JSON object

var allData = [];


var date = new Date("2022-03-03T00:00:00.000Z");

function findChildElementByClassSubstring(element, substring) {

    if(!element || !element.children) {
        return null;
    }

    for (let i = 0; i < element.children.length; i++) {
        if (element.children[i].className.includes(substring)) {
            return element.children[i];
        }
    }
}

function findChildElementByIdSubstring(element, substring) {

    if(!element || !element.children) {
        return null;
    }

    for (let i = 0; i < element.children.length; i++) {
        if (element.children[i].id.includes(substring)) {
            return element.children[i];
        }
    }
    return null;
}

function waitForClassSubstring(ms, element, substring) {
    return new Promise(resolve => setInterval(function() {
        if (findChildElementByClassSubstring(element, substring)) {
            resolve();
        }
    }, ms));
}

function waitForIdSubstring(ms, element, substring) {
    return new Promise(resolve => setInterval(function() {
        if (findChildElementByIdSubstring(element, substring)) {
            resolve();
        }
    }, ms));
}

function waitForFirstElementChild(ms, element) {
    return new Promise(resolve => setInterval(function() {
        if (element.firstElementChild) {
            resolve();
        }
    }, ms));
}

async function loadProofChildElementByClassSubstring(element, substring) {
    let child = findChildElementByClassSubstring(element, substring);
    if (child) {
        return child;
    }
    await waitForClassSubstring(10, element, substring);
    return findChildElementByClassSubstring(element, substring);
}

async function loadProofChildElementByIdSubstring(element, substring) {
    let child = findChildElementByIdSubstring(element, substring);
    if (child) {
        return child;
    }
    await waitForIdSubstring(10, element, substring);
    return findChildElementByIdSubstring(element, substring);
}

async function loadProofFirstElementChild(element) {
    if (element.firstElementChild) {
        return element.firstElementChild;
    }
    await waitForFirstElementChild(10, element);
    return element.firstElementChild;
}

async function parseSearchPanel() {
    let msgs = document.getElementsByClassName("container-rZM65Y");
    console.log("Found " + msgs.length + " messages");

        let data = Array.from(msgs).map(async function (msg, index) {
        let searchResult = await loadProofChildElementByClassSubstring(msg, "searchResult");
        let message = await loadProofChildElementByClassSubstring(searchResult, "message");
        let contentChild = await loadProofChildElementByClassSubstring(message.firstElementChild, "content");

        let headerChild = await Promise.race([
            loadProofChildElementByClassSubstring(contentChild, "header"),
            new Promise(resolve => setTimeout(() => resolve(null), 500))
        ]);

        if(!headerChild) {
            return null;
        }

        let messageContent = await loadProofChildElementByIdSubstring(contentChild, "message-content");

        if(!messageContent.innerText || messageContent.innerText == "") {
            return null;
        }

        messageContent = messageContent.innerText;

        let username = await loadProofChildElementByIdSubstring(headerChild, "message-username");
        username = await loadProofFirstElementChild(username);
        username = username.innerText;

        let timestamp = await loadProofChildElementByClassSubstring(headerChild, "timestamp");

        if(!timestamp) {
            return null;
        }

        timestamp = await loadProofFirstElementChild(timestamp);
        timestamp = timestamp.getAttribute("datetime");

        console.log(messageContent);

        return {
            messageContent: messageContent,
            username: username,
            timestamp: timestamp
        }
    });

    console.log(data);

    data = await Promise.all(data);

    console.log("Returning data");
    return data;
}

function nextPage() {
    let next = document.querySelector('button[rel="next"]');

    if(!next) {
        return false;
    }

    if (next.hasAttribute("disabled")) {
        return false;
    }

    if (next) {
        next.click();
        return true;
    }
    return false;
}

function waitForNoExist(ms) {
    return new Promise(resolve => setInterval(function() {
        if (document.getElementsByClassName("container-rZM65Y").length == 0) {
            resolve();
        }
    }, ms));
}

function waitForExist(ms) {
    return new Promise(resolve => setInterval(function() {
        if (document.getElementsByClassName("container-rZM65Y").length > 0) {
            resolve();
        }
    }, ms));

}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function nextDay() {
    date = new Date(date.getTime() + 86400000);
}

async function parseDay() {
    let pageNum = 1;
    while (true) {
        console.log("Beginning Page " + pageNum);

        newData = await parseSearchPanel();

        console.log("Concatenating Data")
        allData = allData.concat(newData);

        console.log("Switching to Next Page")
        if (!nextPage()) {
            console.log("Terminating Program")
            break;
        }

        console.log("Awaiting Next Page")
        await waitForNoExist(10);
        console.log("Discovered No Longer Exist")
        await waitForExist(10);
        console.log("Discovered Exist")

        await sleep(5000);

        pageNum++;
    }
    console.log(allData);
}