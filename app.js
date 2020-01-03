var counter, total, currentCounter, $total, $progress, $counter, $today, $panel, $chartPanel, $chart, STORE, selectedRecord, selectedIndex, activeChanged, cookieOptions, $templates;

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
    $('button.details').on('click', toggleDropdown);
    $('.record-body').on('click', onClickRecordBody);
    $('.changeTitle').on('click', changeTitle);
    $('.deleteRecord').on('click', deleteRecord);
    $('#showPrayers').on('click', showPrayers);
    $('#showAddRecord, #hideAddRecord').on('click', toggleAddRecord);
    $('.showChart').on('click', showChart);
    $('.chart-panel .close').on('click', closeChartpanel);
    // pulseAll();
    $('body').addClass('animated');
}

function initValues(){
    counter = 0;
    cookieOptions = {expires: 3650};
    $total = $("#total");
    $progress = $("#progress");
    $counter = $("#counter");
    $today = $("#today");
    $title = $("#recordTitle");
    $panel = $('#panel');
    $templates = $('#templates');
    $chartPanel = $('#chart-panel');
    
    STORE = Cookies.getJSON();
    if(STORE.history === undefined) {// All histories of records
        STORE.history = new History();
    }
    if(STORE.selectedIndex === undefined) {
        STORE.selectedIndex = 0;
    }
    if(STORE.records === undefined) {
        var title = prompt("No records yet. Create one !", 'أستغفر الله');
        if(title.trim() == '')
            title = '';
        var newRec = new Record(1, title);
        STORE.records = [newRec];
        STORE.selectedIndex = 0;
        selectedRecord = newRec;
        selectedIndex = 0;
    }
    /* insure that every record has Logbook */
    $.each(STORE.records, function(i, rec){
        if(!STORE.history.all.some(el => el.recordId == rec.id)){
            console.log("Generaing daily Log for record ("+rec.title+")");
            STORE.history.all.push(new Logbook(rec.id));
        }
    });
    // Cookies.remove('history', { path: '' }) // removed!
    // alert(JSON.stringify(STORE.history.lastWriting))
    selectedIndex = STORE.selectedIndex;
    selectedRecord = STORE.records[selectedIndex];
    if(selectedRecord == null || selectedRecord === undefined) selectedRecord = STORE.records[0];
    activeChanged = false; // must be after fillSelectedRecord()    
    saveSTORE("logging");
    fillSelectedRecord();
}

function fillSelectedRecord(){
    $title.text(selectedRecord.title);
    $counter.text(selectedRecord.counter);
    $today.text((selectedRecord.counterLog === undefined) ? 0 : selectedRecord.counterLog);
    $total.text(selectedRecord.total);
    setProgress(selectedRecord.counter);
    activeChanged = true;
}

function selectRecord(recID){
    if(recID === undefined){
        selectedIndex = 0;
        selectedRecord = STORE.records[0];
        return;
    }
    else{
        STORE.records.forEach((rec, i) => {
            if(rec.id == recID){
                selectedIndex = i;
                selectedRecord = rec;
            }
        });
    
    }
    saveSTORE("selectedIndex");
}

function increaseCounter(){
    selectedRecord.counter++; 
    selectedRecord.total++;
    selectedRecord.counterLog++;
    var refreshCounter = selectedRecord.counter % 10 == 0;
    var today = selectedRecord.counterLog % 10 == 0 ? selectedRecord.counterLog : undefined;
    setProgress(selectedRecord.counter, refreshCounter, today);
    saveSelectedRecord();
    if(selectedRecord.counter % 100 == 0){
        pulse($counter, 1);
    }
    if(selectedRecord.counterLog % 100 == 0){
        pulse($today, 2);
    }
    if(selectedRecord.total % 100 == 0){
        $total.text(selectedRecord.total);
        pulse($total, 1);
    }
}

function setProgress(counter, refreshCounter, today){
    if(refreshCounter === undefined) refreshCounter = true;
    if(today === undefined) today = -1;
    if(refreshCounter){
        $counter.text(counter); 
    }
    if(today != -1){
        $today.text(today); 
    }
    $progress.find('.val').attr('class', 'val c-'+(counter%100));
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
    pulse($('#showPanel, #closePanel'), 2);
    togglePannel();
    showRecords();    
}

function onClosePanel(){
    pulse($('#showPanel, #closePanel'), 2);
    if(activeChanged){
        pulseAll();
        activeChanged = false;
    }
    togglePannel();
}

function showRecords(){
    $panel.find('.record').remove();
    STORE.records.forEach(record => {
        addRecordToPanel(record);
        // if($('#chart-panel-'+record.id).length == 0){
        //     createChartPanel(record);
        // }
    });
}

function addRecordToPanel(record){
    console.log(record); 
    var tpl = $templates.find('.record-tpl').clone(true);
    tpl.attr('id', 'record-'+record.id).attr('data-id', record.id).attr('data-title', record.title);
    tpl.removeClass('d-none record-tpl').addClass('record').toggleClass('color-primary active', selectedRecord.id == record.id);
    tpl.find('.title').text(record.title);
    tpl.find('.counter').text(record.counter);
    tpl.find('.today').text((record.counterLog || 0) + ' today');
    tpl.find('.total').text('TOTAL ' + record.total);
    tpl.prependTo( $panel.find('.records') );
}

// function createChartPanel(record){
//     var chartPanel = $templates.find('.chart-panel').clone(true);
//     chartPanel.attr('id', 'chart-panel-'+record.id);
//     chartPanel.find('.title').text(record.title);
//     chartPanel.appendTo('body');
// }

function createRecord(){
    var $input = $('#add-record-input');
    if($input.val().length == 0){
        $input.attr('placeholder', 'Empty title entered!');
    }
    else{
        pulse($(this), 1);
        var newRecord = new Record(newID(), $input.val());
        STORE.records.push(newRecord);
        addRecordToPanel(newRecord, STORE.records.length-1);
        STORE.history.all.push(new Logbook(newRecord.id, new Log(Date.now(), newRecord.counter)));
        saveSTORE(); // records + selectedIndex + history
        $input.val('');
        pulse($panel.find('.record').first(), 1);
        // createChartPanel(newRecord);
    }
    pulse($input);
    pulse($(this), 1);
    $input.focus();
}

function saveSelectedRecord(){
    STORE.records[selectedIndex] = selectedRecord;
    saveSTORE("records", selectRecord);
}

function saveSTORE(toSave, record){
    if(toSave === undefined) toSave = "all";
    if(toSave == "all" || toSave == "records"){
        Cookies.set("records", STORE.records, cookieOptions);
        console.log("Records saved!");
    }
    if(toSave == "all" || toSave == "selectedIndex"){
        STORE.selectedIndex = selectedIndex;
        Cookies.set("selectedIndex", selectedIndex, cookieOptions);
        console.log("selectedIndex saved!"); 
    }
    if(toSave == "all" || toSave == "history"){
        Cookies.set("history", STORE.history, cookieOptions);
        console.log("LogBook created!"); 
    }
    else if(toSave == "logging"){// logging
        var today = new Date();
        var lastWriting = new Date(Date.parse(STORE.history.lastWriting));
        if(lastWriting.getDate() != today.getDate() || lastWriting.getMonth() != today.getMonth() || lastWriting.getFullYear() != today.getFullYear()){
            STORE.history.lastWriting = today.toLocaleString("en"); // timestamp
            console.log("History is lastWritten today", today.toLocaleString("en"));
            $.each(STORE.records, function(i, rec){
                $.each(STORE.history.all, function(j, logBook){
                    if(rec.id == logBook.recordId){
                        var yesterday = new Date();
                        yesterday.setDate(yesterday.getDate()-1);
                        logBook.logs.push(new Log(yesterday.toLocaleString("en")/* timestamp */, rec.counterLog)); // save the daily every time you save
                        rec.counterLog = 0;
                    }
                });
            });
            Cookies.set("history", STORE.history, cookieOptions);
            console.log("Logging saved!");
        }
    }
    console.log("COOKIE STORE", STORE);
}

function toggleDropdown(){
    var $this = $(this);
    $this.closest('.record').toggleClass('showDropdown');
}

function onClickRecordBody(){
    $('.record').removeClass('color-primary active');
    var $rec = $(this).closest('.record');
    $rec.addClass('color-primary active');
    selectRecord($rec.attr('data-id'));
    fillSelectedRecord();
    pulse($rec);
}

function recIndexByID(id){
    return STORE.records.findIndex(el => el.id == id);
}

function changeTitle(){
    var $rec = $(this).closest('.record');
    var newTitle = prompt("New title:", $rec.attr('data-title'));
    while(newTitle.trim() == '' || newTitle == null){
        alert('You cannot enter an empty title!');
        newTitle = prompt("New title:", $rec.attr('data-title'));
    }
    var index = recIndexByID($rec.attr('data-id'));
    STORE.records[index].title = newTitle;
    setRecordTitle($rec.attr('data-id'), newTitle); // DOM
    saveSTORE("records");
}

function deleteRecord(){
    var $rec = $(this).closest('.record');
    if($('.record').length == 1){
        alert("Delete aborted. It is the only record you have..");
    }
    else if(confirm('Are you sure to delete "' + $rec.attr('data-title') + '"?')){
        STORE.records = STORE.records.filter(el => el.id != $rec.attr('data-id'));
        STORE.history.all = STORE.history.all.filter(el => el.recordId != $rec.attr('data-id'));
        $('#record-'+$rec.attr('data-id')).remove();
        if($rec.attr('data-id') == selectedRecord.id){
            selectRecord(); // the first index
            fillSelectedRecord();
            return;
        }
        saveSTORE();
    }
}

function setRecordTitle(id, newTitle){ // DOM only
    $('#record-'+id).find('.title').text(newTitle);
    if(id == selectedRecord.id){
        $('#recordTitle').text(newTitle);
    }
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
    pulse($today, 2);
    pulse($title, 2);
    pulse($total, 2);
}

function showPrayers(){
    window.location = "./prayers.html";
}

function toggleAddRecord(){
    $panel.toggleClass('showAddRecord');
    $panel.find('#showAddRecord').toggleClass('d-none');
    $panel.find('#hideAddRecord').toggleClass('d-none');
    $panel.find('#add-record-input').focus();
    pulse($('#showAddRecord, #hideAddRecord'), 2);
}

function uniqID(){
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function showChart(e){
    var id = $(this).closest('.record').attr('data-id');
    $chart = $chartPanel.find('.chart-container');
    // var $chart = $templates.find('.chart-tpl').clone();
    // $chartPanel.find('.chart-container').html($chart);
    $chartPanel.toggleClass('show');
    $chartPanel.find('.loading').addClass('d-flex').removeClass('d-none');
    $chartPanel.find('.container').addClass('hide');
    drawChart(id);
    $chartPanel.find('.loading').removeClass('d-flex').addClass('d-none');
    $chartPanel.find('.container').removeClass('hide');
}

function closeChartpanel(){
    $chartPanel.find('.chart-container canvas').remove();
    $(this).closest('.chart-panel').removeClass('show');
}

function drawChart(recID){
    var dataPoints = [];
    var logBook = STORE.history.all.find(el => el.recordId == recID);
    var today = new Date();
    var d = new Date();
    if(logBook.logs.length == 0){
        dataPoints.push({x: today.getDate()+'/'+(today.getMonth()+1), y: 0});
    }
    var index = 0;
    if(logBook.logs.length >= 5){
        index = logBook.logs.length - 5;
    }
    logBook.logs.splice(index).forEach(el => { 
        d = new Date(Date.parse(el.date));
        dataPoints.push({x: d.getDate()+'/'+(d.getMonth()+1), y: el.value});
    }); 
    /* Add today to chart */
    var rec = STORE.records.find(el => el.id == recID);
    dataPoints.push({x: today, y: rec.counterLog});
    /* https://canvasjs.com/jquery-charts/dynamic-chart/ */
    
    var chart = new CanvasJS.Chart("chart-container",
    {
        animationEnabled: true,
        backgroundColor: "#2f2f2f",
        title: {
            text: rec.title,
            fontColor: "#c6ff00"
        },
        axisX:{
            title: "Red Color labels",
            titleFontColor: "c6ff00",
            labelFontColor: "#c6ff00",
            labelAngle: -50,
            valueFormatString: "DD-MM"
        },
        axisY:{
            labelFontColor: "#c6ff00"
        },
        toolTip:{
            enabled: true,
            animationEnabled: true,
            fontColor: "#c6ff00"
        },
        data: [
            {
                type: "line",
                dataPoints: dataPoints,
                showInLegend: true,
                lineColor: "#c6ff00",
                markerColor: "red",
            }
        ],
        // width: 100,
        // height: 100
    });

    chart.render();

    console.log("Chart !");
}

function newID(arr, idProp){
    if(arr === undefined) arr = STORE.records;
    if(idProp === undefined) idProp = 'id';
    return arr[arr.length-1][idProp] + 1;
}

window.onload = init();