chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        switch(request.request){
            case "geturl":
                sendResponse(chrome.extension.getURL(request.data));
                break;
            default:
                break;
        }
    }
);