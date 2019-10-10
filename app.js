// important order for these functions
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires;// + ",path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

// important order after here !
var counter, total, currentCounter, progressIncBy, $total, $progress, $counter, $panel, STORE, selectedRecord, selectedIndex;

function init() {
    initValues();
    if( selectedRecord === undefined){
        setProgress(0);
    }else{
        setProgress(selectedRecord.counter);
    }
    $('#showPanel').on('click', onShowPanel);
    $('#closePanel').on('click', onClosePanel);
    $('#add-record-btn').on('click', createRecord);
}

function initValues(){
    counter = 0;
    progressIncBy = 1;
    $total = document.getElementById("total");
    $progress = document.getElementById("Progress");
    $counter = document.getElementById("progressSpan");
    $title = document.getElementById("recordTitle");
    $panel = $('#panel');
    
    STORE = Cookies.get("store");
    console.log(STORE)
    if(STORE === undefined) {
        STORE = new Store();
    }
    selectedIndex = STORE.selectedIndex;
    selectedRecord = STORE.records[selectedIndex];
    $title.textContent = selectedRecord.title;
    $counter.textContent = selectedRecord.counter;
    $total.textContent = selectedRecord.total;
}

function increaseCounter(){
    selectedRecord.counter++; 
    selectedRecord.total++;
    if(selectedRecord.counter % 10 == 0){
        setProgress(selectedRecord.counter);
    }else{
        setProgress(selectedRecord.counter, false);
    }
    if(selectedRecord.total % 100 == 0){
        $total.textContent = selectedRecord.total;
        setProgress(0, false);
    }
    saveSelectedRecord();
}

function setProgress(number, withNumber){ 
    if(withNumber === undefined) withNumber = true;
    if(withNumber){
        $counter.textContent = number; 
    }
    $progress.className = 'c100 big dark';
    $progress.classList.add('p'+number%100);
}

function reset(){ 
    counter = 0; 
    setProgress(0);
    setCookie("counter", counter, 30);
}

function togglePannel(){
    var _bottom = -($panel.css('bottom').replace(/[^\d\.]/g, ''));
    if(_bottom < 0) _bottom = 0;
    else _bottom = '-120%';
    $panel.css({bottom: _bottom});
}

function onShowPanel(){
    togglePannel();
    showRecords(STORE.records);    
}

function onClosePanel(){
    togglePannel();
}

function showRecords(records){ 
    $panel.find('.record').remove();
    $.each(records, function(i, record){
        addRecordToPanel(record);
    });
}

function addRecordToPanel(newRecord){
    var tpl = $('.record-tpl').clone(true);
    tpl.removeClass('record-tpl d-none').addClass('record');
    tpl.find('.title').text(newRecord.title);
    tpl.find('.counter').text(newRecord.counter);
    tpl.prependTo( $panel.find('.all-records') );
}

function clearRecordsDom(){
    $panel.find('.record').remove();  
}

function createRecord(){
    var $input = $('#add-record-input');
    var newRecord = new Record($input.val());
    STORE.records.unshift(newRecord);
    addRecordToPanel(newRecord);
    saveSTORE();
    $input.val('');
}

function saveSelectedRecord(){
    STORE.records[selectedIndex] = selectedRecord;
    console.log("selectedRecord saved!", STORE); 
    saveSTORE();
}

function saveSTORE(){
    console.log("store saved!", STORE);
    Cookies.set("store", STORE);
}


window.onload = init();

/* 
    TODO:
    - change the selected record
    - detail-panel for record
*/
