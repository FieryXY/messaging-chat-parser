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
    for (let i = 0; i < element.children.length; i++) {
        if (element.children[i].className.includes(substring)) {
            return element.children[i];
        }
    }
}

function findChildElementByIdSubstring(element, substring) {
    for (let i = 0; i < element.children.length; i++) {
        if (element.children[i].id.includes(substring)) {
            return element.children[i];
        }
    }
}

function parseSearchPanel() {
    msgs = document.getElementsByClassName("container-rZM65Y")
    data = Array.from(msgs).map(msg => {
        let searchResult = findChildElementByClassSubstring(msg, "searchResult");
        let message = findChildElementByClassSubstring(searchResult, "message");
        let contentChild = findChildElementByClassSubstring(message.firstElementChild, "content");
        let headerChild = findChildElementByClassSubstring(contentChild, "header");
        let messageContent = findChildElementByIdSubstring(contentChild, "message-content").innerText;
        let username = findChildElementByIdSubstring(headerChild, "message-username").firstElementChild.innerText;
        let timestamp = findChildElementByClassSubstring(headerChild, "timestamp").firstElementChild.getAttribute("datetime");
        return {
            messageContent: messageContent,
            username: username,
            timestamp: timestamp
        }
    });
    return data;
}

function nextPage() {
    let next = document.querySelector('button[rel="next"]');

    if (next.hasAttribute("disabled")) {
        return false;
    }

    if (next) {
        next.click();
        return true;
    }
    return false;
}

//Js synchronous sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function nextDay() {
    date = new Date(date.getTime() + 86400000);

}

async function parseDay() {
    while (true) {
        allData = allData.concat(parseSearchPanel());
        if (!nextPage()) {
            break;
        }
        await sleep(10000);
    }
    console.log(allData);
}