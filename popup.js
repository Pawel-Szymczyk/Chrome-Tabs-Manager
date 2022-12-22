// -----------------------------------------------------------------
// global variables...
//
let isToggled = false;

// -----------------------------------------------------------------
// buttons...
//

// ...save tabs belong to single window
const saveWindowTabsBtn = document.getElementById("save-window-tabs");
saveWindowTabsBtn.addEventListener("click", async() => {
    await saveWindowTabsBtnHandler();
});

// ...save all tabs 
const saveAllTabsBtn = document.getElementById("save-tabs");
saveAllTabsBtn.addEventListener("click", async() => {
    await saveAllTabsBtnHandler();
});

// ...toggle between open tabs modes
const switchBtn = document.getElementById("switch");
switchBtn.addEventListener("change", async() => {
    await switchBtnHandler(switchBtn.checked);
});

// ...import file 
const fileForUploadBtn = document.getElementById("fileForUpload");
fileForUploadBtn.addEventListener("change", async() => {
    let file = fileForUploadBtn.files[0];
    await fileForUploadBtnHandler(file);
});


// -----------------------------------------------------------------
// buttons handlers...
//
async function saveWindowTabsBtnHandler() {
    const windowId = await getCurrentWindowIdAsync();
    const tabs = await getTabsAsync(windowId);
    const json = buildJson(tabs);
    const jsonBlob = getStringifiedJsonBlob(json);
    const jsonFilename = getDefaultJsonFilename(true);
    downloadJsonFile(jsonFilename, jsonBlob);
}

async function saveAllTabsBtnHandler() {
    const tabs = await getTabsAsync();
    const json = buildJson(tabs);
    const jsonBlob = getStringifiedJsonBlob(json);
    const jsonFilename = getDefaultJsonFilename(false);
    downloadJsonFile(jsonFilename, jsonBlob);
}

async function switchBtnHandler(isChecked) {
    isToggled = isChecked;
    resetFileInput();
}

async function fileForUploadBtnHandler(file) {
    // get json data
    const jsonData = await parseJsonFileAsync(file);
    
    // get urls from json
    let urls = [];
    for(const data of jsonData) {
        urls.push(data.url);
    }

    if(isToggled) {
        // open tabs in new browser window
        await openTabsInNewWindowAsync(urls);
    }
    else {
        // open tabs in current browser window
        const windowId = await getCurrentWindowIdAsync();
        for (const url of urls) {
            await openTabsInTheSameWindowAsync(windowId,url);
        }
    }
}


// -----------------------------------------------------------------
// functions 
//

// ------------------------------------------
// chrome related functions

// get chrome window (browser) id.
async function getCurrentWindowIdAsync() {
    const currentWindow = await chrome.windows.getCurrent({});
    return currentWindow.id;
}

// return all existing chrome tabs if windowId is not specified.
// return subset of chrome tabs if windowId is specified.
async function getTabsAsync(widnowId) {
    let queryOptions = {
        windowId: widnowId,
    };
    
    return await chrome.tabs.query(queryOptions);
}

async function openTabsInNewWindowAsync(urlsArray) {
    let createData = {
        focused: true,
        url: urlsArray,
    };

    await chrome.windows.create(createData);
}

async function openTabsInTheSameWindowAsync(windowId, url) {
    let createProperties = {
        active: false,
        url: url, 
        windowId: windowId
    };
    
    await chrome.tabs.create(createProperties);
}
// ------------------------------------------


// read JSON file
async function parseJsonFileAsync(file) {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      fileReader.onload = event => resolve(JSON.parse(event.target.result))
      fileReader.onerror = error => reject(error)
      fileReader.readAsText(file)
    })
}

// build JSON object array.
function buildJson(tabs) {

    let objects = [];

    // create an object and add it to array
    for (const tab of tabs) {
        var newObj = {
            title: tab.title,
            url: tab.url
        };
        objects.push(newObj);
    }    

    return objects;
}

// stringify json and return blob of type json.
function getStringifiedJsonBlob(jsonObject) {
    let jsonse = JSON.stringify(jsonObject);
    let blob = new Blob([jsonse], {type:"application/json"});
    return blob;
}

// build json file name.
// - isSingleWindow (browser): boolean
function getDefaultJsonFilename(isSingleWindow) {

    // debugger;
    let fileName = "";

    // build date
    const date = new Date();
    const year = date.getFullYear();
    const year2digits = year.toString().substring(2);
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();

    const timestamp = `#${year2digits}${month}${day}`;

    if(isSingleWindow) {
        fileName = `chromeTabs_singleWindow_${timestamp}.json`;
    }
    else {
        fileName = `chromeTabs_${timestamp}.json`;
    }

    return fileName;
}

// download JSON file on btn click
function downloadJsonFile(fileName, blob) {
    let downloadLink = document.createElement("a"); 
    downloadLink.download = fileName;
    downloadLink.href = window.webkitURL.createObjectURL(blob);
    downloadLink.click();
}

function resetFileInput() {
    document.getElementById('fileForUpload').value= null;
}
