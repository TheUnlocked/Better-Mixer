function addToChat(text) {
    let doc = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getDoc();
    let cursor = doc.getCursor();

    let insertText = (doc.getLine(cursor.line)[cursor.ch - 1] == ' ' ? '' : ' ') +
                     text +
                     (doc.getLine(cursor.line)[cursor.ch] == ' ' ? '' : ' ');

    doc.replaceSelection(insertText, select='end');
}

function populateTimeout(username) {
    let cm = document.getElementsByClassName('CodeMirror')[0].CodeMirror;
    let doc = cm.getDoc();

    let newStr = `/timeout @${username} 5m`;
    doc.setValue(newStr);
    cm.focus();
    doc.setSelection({line: 0, ch: newStr.length - 2}, {line: 0, ch: newStr.length});
}

function populateBan(username) {
    let doc = document.getElementsByClassName('CodeMirror')[0].CodeMirror.getDoc();

    doc.setValue(`/ban @${username}`);
    cm.focus();
}

document.currentScript.addEventListener('addToChat', (event) => addToChat(event.detail));
document.currentScript.addEventListener('populateTimeout', (event) => populateTimeout(event.detail));
document.currentScript.addEventListener('populateBan', (event) => populateBan(event.detail));

(function(history){
    var pushState = history.pushState;
    history.pushState = function(state) {
        if (typeof history.onpushstate == "function") {
            history.onpushstate({state: state});
        }
        
        window.dispatchEvent(new CustomEvent('pushState'));

        return pushState.apply(history, arguments);
    };
})(window.history);

// function waitFor$(){
//     if($){
//         $.initialize('.CodeMirror', (s, element) => {
//             element.CodeMirror.addKeyMap({
//                 'Up': 'goLineUp',
//                 'Down': 'goLineDown'
//             }, true);
//         });
//     }
//     else{
//         setTimeout(waitFor$, 100);
//     }
// }

// waitFor$();
