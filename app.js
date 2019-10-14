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
    $('.toggleDropdown').on('click', toggleDropdown);
    $('.setDefault').on('click', toggleSetDefault);
}

function initValues(){
    counter = 0;
    progressIncBy = 1;
    $total = document.getElementById("total");
    $progress = document.getElementById("Progress");
    $counter = document.getElementById("progressSpan");
    $title = document.getElementById("recordTitle");
    $panel = $('#panel');
    
    STORE = Cookies.getJSON("store");
    console.log(STORE, typeof STORE);
    if(STORE === undefined) {
        STORE = new Store();
    }
    setDefaultRecord(STORE.selectedIndex);
}

function setDefaultRecord(newIndex){
    selectedIndex = newIndex;
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
    selectedRecord.counter = 0; 
    setProgress(0);
    saveSelectedRecord();
}

function togglePannel(){
    var _left = -($panel.css('left').replace(/[^\d\.]/g, ''));
    if(_left < 0) _left = 0;
    else _left = '-120%';
    $panel.css({left: _left});
}

function onShowPanel(){
    togglePannel();
    showRecords(STORE.records);    
}

function onClosePanel(){
    togglePannel();
}

function showRecords(records){ 
    clearRecordsDom();
    $.each(records, function(i, record){
        addRecordToPanel(record, i);
    });
}

function addRecordToPanel(newRecord, index){
    console.log("record", newRecord); 
    var tpl = $('#record-tpl').clone(true);
    tpl.removeClass('d-none').addClass('record').attr('id', '');
    tpl.find('.title').text(newRecord.title);
    tpl.find('.counter').text(newRecord.counter);
    tpl.find('.setDefault').toggleClass('active', newRecord.isDefault);
    tpl.attr('data-index', index);
    tpl.find('.dropdown').attr('data-index', index);
    tpl.prependTo( $panel.find('.all-records') );
}

function clearRecordsDom(){
    $panel.find('.record').remove();  
}

function createRecord(){
    var $input = $('#add-record-input');
    var newRecord = new Record($input.val());
    STORE.records.push(newRecord);
    addRecordToPanel(newRecord);
    saveSTORE();
    $input.val('');
}

function saveSelectedRecord(){
    STORE.records[selectedIndex] = selectedRecord;
    saveSTORE();
}

function saveSTORE(){
    Cookies.set("store", STORE);
    console.log("store saved!", STORE);
}

function toggleDropdown(){
    var $this = $(this);
    $this.toggleClass('active');
}

function toggleSetDefault(){
    $('.setDefault').removeClass('active');
    var $this = $(this);
    $this.addClass('active');
    selectedRecord.isDefault = !selectedRecord.isDefault;
    saveSelectedRecord();
    setDefaultRecord($this.parent('.record').attr('data-index'));
}

window.onload = init();

/* 
    TODO:
    - change the selected record
    - detail-panel for record
*/
