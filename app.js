var counter, total, currentCounter, $total, $progress, $counter, $panel, STORE, selectedRecord, selectedIndex, activeChanged;

function init() {
    initValues();
    if( selectedRecord === undefined){
        setProgress(0);
    }else{
        setProgress(selectedRecord.counter);
    }
    $('body').on('click', function(e) {e.stopPropagation();});
    $('#clicker').on('click', increaseCounter);
    $('#reset').on('click', reset);
    $('#showPanel').on('click', onShowPanel);
    $('#closePanel').on('click', onClosePanel);
    $('#add-record-btn').on('click', createRecord);
    $('.toggleDropdown').on('click', toggleDropdown);
    $('.activate').on('click', toggleActivate);
    $('.changeTitle').on('click', changeTitle);
    $('.deleteRecord').on('click', deleteRecord);
    pulseAll();
}

function initValues(){
    counter = 0;
    $total = $("#total");
    $progress = $("#progress");
    $counter = $("#counter");
    $title = $("#recordTitle");
    $panel = $('#panel');
    
    STORE = Cookies.getJSON("store");
    if(STORE === undefined) {
        STORE = new Store();
    }
    activateRecord(STORE.selectedIndex);
    activeChanged = false; // must be after activateRecord()    
}

function activateRecord(newIndex){
    if(newIndex === undefined || newIndex >= STORE.records.length) newIndex = 0;
    newIndex = Number(newIndex);
    selectedIndex = newIndex;
    STORE.selectedIndex = newIndex;
    STORE.records.forEach(el => el.isActive = false);
    STORE.records[selectedIndex].isActive = true;
    selectedRecord = STORE.records[selectedIndex];
    $title.text(selectedRecord.title);
    $counter.text(selectedRecord.counter);
    $total.text(selectedRecord.total);
    setProgress(selectedRecord.counter);
    saveSTORE();
    activeChanged = true;
}

function increaseCounter(){
    selectedRecord.counter++; 
    selectedRecord.total++;
    var withNumber = true;
    if(selectedRecord.counter % 10 != 0){
        withNumber = false;
    }
    if(selectedRecord.counter % 100 == 0){
        pulse($counter, 1);
    }
    if(selectedRecord.total % 100 == 0){
        $total.text(selectedRecord.total);
        pulse($total, 1);
    }
    setProgress(selectedRecord.counter, withNumber);
    saveSelectedRecord();
}

function setProgress(number, withNumber){ 
    if(withNumber === undefined) withNumber = true;
    if(withNumber){
        $counter.text(number); 
    }
    $progress.find('.val').attr('class', 'val c-'+(number%100));
    pulse($progress);
}

function reset(){ 
    selectedRecord.counter = 0; 
    setProgress(0);
    saveSelectedRecord();
}

function togglePannel(){
    $panel.toggleClass('show');
}

function onShowPanel(){
    pulse($(this), 2);
    togglePannel();
    showRecords(STORE.records);    
}

function onClosePanel(){
    pulse($(this), 2);
    if(activeChanged){
        pulseAll();
        activeChanged = false;
    }
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
    tpl.removeClass('d-none').addClass('record').toggleClass('color-primary', newRecord.isActive).attr('id', '');
    tpl.find('.title').text(newRecord.title);
    tpl.find('.counter').text(' ('+newRecord.counter+')');
    tpl.find('.activate').toggleClass('active', newRecord.isActive);
    tpl.attr('data-index', index).attr('data-title', newRecord.title);
    tpl.prependTo( $panel.find('.all-records') );
}

function clearRecordsDom(){
    $panel.find('.record').remove();  
}

function createRecord(){
    var $input = $('#add-record-input');
    pulse($input);
    pulse($(this), 1);
    var newRecord = new Record($input.val());
    STORE.records.push(newRecord);
    addRecordToPanel(newRecord, STORE.records.length-1);
    saveSTORE();
    $input.val('');
    $input.focus();
}

function saveSelectedRecord(){
    STORE.records[selectedIndex] = selectedRecord;
    saveSTORE();
}

function saveSTORE(){
    var options = {expires: 3650};
    Cookies.set("store", STORE, options);
    console.log("store saved!", STORE);
}

function toggleDropdown(){
    var $this = $(this);
    $this.closest('.record').toggleClass('showDropdown');
}

function toggleActivate(){
    $('.activate').removeClass('active');
    $('.record').removeClass('color-primary');
    var $this = $(this);
    $this.addClass('active');
    $this.closest('.record').addClass('color-primary');
    var index = $this.closest('.record').attr('data-index');
    activateRecord(index);
}

function changeTitle(){
    var index = $(this).closest('.record').attr('data-index');
    var currentTitle = $(this).closest('.record').attr('data-title');
    var newTitle = prompt("New title:", currentTitle);
    if (newTitle != null) {
        STORE.records[index].title = newTitle;
        setRecordTitle(index, newTitle); // DOM
        saveSTORE();
    }
}

function deleteRecord(){
    var index = $(this).closest('.record').attr('data-index');
    var title = $(this).closest('.record').attr('data-title');
    if(confirm('Are you sure to delete "'+title+'"?')){
        STORE.records.splice(index, 1);
        removeRecord(index);
        if(index == selectedIndex){
            activateRecord(0);
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

function pulse($element, i){ 
    if(i === undefined) i = 0;
    var types = ['pulse', 'pulseText', 'pulseTextLong', 'pulseLong'];
    $element.removeClass(types);
    $element.width();
    $element.addClass(types[i]);
}

function pulseAll(){
    pulse($progress, 3);
    pulse($counter, 2);
    pulse($title, 2);
    pulse($total, 2);
}
window.onload = init();