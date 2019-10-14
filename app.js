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
    $('.changeTitle').on('click', changeTitle);
    $('.deleteRecord').on('click', deleteRecord);
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
    // TODO: check records.some(el => return el.defaul) any of them is set to default, else take zero index
}

function setDefaultRecord(newIndex){
    if(newIndex === undefined || newIndex >= STORE.records.length) newIndex = 0;
    newIndex = Number(newIndex);
    selectedIndex = newIndex;
    STORE.selectedIndex = newIndex;
    STORE.records.forEach(el => el.isDefault = false);
    STORE.records[selectedIndex].isDefault = true;
    selectedRecord = STORE.records[selectedIndex];
    $title.textContent = selectedRecord.title;
    $counter.textContent = selectedRecord.counter;
    $total.textContent = selectedRecord.total;
    setProgress(selectedRecord.counter);
    saveSTORE();
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
    console.log("record", newRecord, "index:", index); 
    var tpl = $('#record-tpl').clone(true);
    tpl.removeClass('d-none').addClass('record').attr('id', '');
    tpl.find('.title').text(newRecord.title);
    tpl.find('.counter').text(newRecord.counter);
    tpl.find('.setDefault').toggleClass('active', newRecord.isDefault);
    tpl.attr('data-index', index);
    tpl.prependTo( $panel.find('.all-records') );
}

function clearRecordsDom(){
    $panel.find('.record').remove();  
}

function createRecord(){
    var $input = $('#add-record-input');
    var newRecord = new Record($input.val());
    STORE.records.push(newRecord);
    addRecordToPanel(newRecord, STORE.records.length-1);
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
    var index = $this.closest('.record').attr('data-index');
    setDefaultRecord(index);
}

function changeTitle(){
    var index = $(this).closest('.record').attr('data-index');
    var currentTitle = $(this).closest('.dropdown').siblings('.title').text();
    var newTitle = prompt("New title:", currentTitle);
    // console.log("", index, currentTitle, STORE.records[index]); 
    if (newTitle != null) {
        STORE.records[index].title = newTitle;
        setRecordTitle(index, newTitle); // DOM
        saveSTORE();
    }
}

function deleteRecord(){
    var index = $(this).closest('.record').attr('data-index');
    var title = $(this).closest('.dropdown').siblings('.title').text();
    console.log("", title, index); 
    if(confirm('Are you sure to delete "'+title+'"?')){
        STORE.records.splice(index, 1);
        removeRecord(index);
        if(index == selectedIndex){
            setDefaultRecord(0);
            return;
        }
        saveSTORE();
    }
}

function setRecordTitle(index, newTitle){ // DOM only
    $('[data-index='+index+']').find('.title').text(newTitle);
    if(index == selectedIndex){
        $('#recordTitle').text(newTitle);
    }
}

function removeRecord(index){ // DOM only
    $('[data-index='+index+']').remove();
}

window.onload = init();

/* 
    TODO:
    - change the selected record
    - detail-panel for record
*/
