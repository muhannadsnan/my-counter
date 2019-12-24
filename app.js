var counter, total, currentCounter, $total, $progress, $counter, $today, $panel, STORE, selectedRecord, selectedIndex, activeChanged, cookieOptions, $templates;

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
    $('.record-body').on('click', toggleActivate);
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
    
    STORE = Cookies.getJSON();
    if(STORE.store !== undefined){
        console.log("An old store structure found..", STORE); 
        STORE.selectedIndex = STORE.store.selectedIndex;
        STORE.records = [];
        $.each(STORE.store.records, function(i, el){
            STORE.records.push(new Record(i+1, el.title, el.counter, el.total, el.isActive));
        });
        saveSTORE();
        console.log("The old store was migrated and saved!"); 
        Cookies.remove('store');
        console.log("Old store removed........." ); 
    }
    if(STORE.selectedIndex === undefined) {
        STORE.selectedIndex = 0;
    }
    if(STORE.history === undefined) {// All histories of records
        STORE.history = {all: [], lastWriting: 0};
        // STORE.history.all = [];
        // STORE.history.lastWriting = 0;
    }
    if(STORE.records === undefined) {
        var title = prompt("No records yet. Create one !", 'أستغفر الله');
        STORE.records = [new Record(1, title)];
        STORE.selectedIndex = 0;
    }
    /* insure that every record has Logbook */
    $.each(STORE.records, function(i, rec){
        if(!STORE.history.all.some(x => x.recordId == rec.id)){
            console.log("Generaing daily Log for record ("+rec.title+")")
            STORE.history.all.push(new Logbook(rec.id));
        }
    });
    activateRecord(STORE.selectedIndex);
    activeChanged = false; // must be after activateRecord()    
    saveSTORE("logging");
}

function activateRecord(newIndex){
    if(newIndex === undefined || newIndex >= STORE.records.length) newIndex = 0;
    selectedIndex = Number(newIndex);
    STORE.selectedIndex = selectedIndex;
    STORE.records.forEach(el => el.isActive = false);
    STORE.records[selectedIndex].isActive = true;
    selectedRecord = STORE.records[selectedIndex];
    if(selectedRecord.counterLog === undefined) selectedRecord.counterLog = 0;
    $title.text(selectedRecord.title);
    $counter.text(selectedRecord.counter);
    $today.text(selectedRecord.counterLog);
    $total.text(selectedRecord.total);
    setProgress(selectedRecord.counter);
    saveSTORE();
    activeChanged = true;
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
        if($templates.find('.chart-panel.'+i).length == 0){
            createChartPanel(i, record.title);
        }
    });
}

function createChartPanel(index, title){
    var chartPanel = $templates.find('.chart-panel').clone(true);
    chartPanel.find('.title').text(title);
    chartPanel.appendTo('body').addClass(''+index);
}

function addRecordToPanel(newRecord, index){
    console.log("record", newRecord, "index:", index); 
    var tpl = $templates.find('.record-tpl').clone(true);
    tpl.removeClass('d-none').addClass('record').toggleClass('color-primary', newRecord.isActive);
    tpl.find('.title').text(newRecord.title);
    tpl.find('.counter').text(newRecord.counter);
    tpl.find('.today').text((newRecord.counterLog || 0) + ' today');
    tpl.find('.total').text('TOTAL ' + newRecord.total);
    tpl.toggleClass('active', newRecord.isActive);
    tpl.attr('data-index', index).attr('data-title', newRecord.title);
    tpl.prependTo( $panel.find('.records') );
}

function clearRecordsDom(){
    $panel.find('.record').remove();  
}

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
        saveSTORE("all", newRecord); // records + history but not logging
        $input.val('');
        pulse($panel.find('.record').first(), 1);
        createChartPanel(STORE.records.length-1, newRecord.title);
    }
    pulse($input);
    pulse($(this), 1);
    $input.focus();
}

function saveSelectedRecord(){
    STORE.records[selectedIndex] = selectedRecord;
    saveSTORE();
}

function saveSTORE(toSave, record){
    if(toSave === undefined || toSave == "records" || toSave == "all"){
        Cookies.set("records", STORE.records, cookieOptions);
        Cookies.set("selectedIndex", STORE.selectedIndex, cookieOptions);
        console.log("Records saved!");
    }
    if(toSave == "all"){
        STORE.history.all.push(new Logbook(record.id, new Log(Date.now(), record.counter)));
        Cookies.set("history", STORE.history, cookieOptions);
        console.log("LogBook created!"); 
    }
    else if(toSave == "logging"){// logging
        var today = new Date();
        var lastWriting = new Date(STORE.history.lastWriting);
        if(lastWriting.getDate() != today.getDate() || lastWriting.getMonth() != today.getMonth() || lastWriting.getFullYear() != today.getFullYear()){
            STORE.history.lastWriting = Date.now(); // timestamp
            console.log("History is lastWritten today", lastWriting);
            $.each(STORE.records, function(i, rec){
                $.each(STORE.history.all, function(j, logBook){
                    if(rec.id == logBook.recordId){
                        logBook.logs.push(new Log(Date.now(), rec.counterLog)); // save the daily every time you save
                        rec.counterLog = 0;
                    }
                });
            });
        }
        Cookies.set("history", STORE.history, cookieOptions);
        console.log("Logging saved!");
    }
    console.log("COOKIE STORE", STORE);
}

function toggleDropdown(){
    var $this = $(this);
    $this.closest('.record').toggleClass('showDropdown');
}

function toggleActivate(){
    $('.record').removeClass('color-primary active');
    var $this = $(this);
    $this.closest('.record').addClass('color-primary active');
    var index = $this.closest('.record').attr('data-index');
    activateRecord(index);
    pulse($this.closest('.record'));
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

function setRecordTitle(index, newTitle){// DOM only
    $('[data-index='+index+']').find('.title').text(newTitle);
    if(index == selectedIndex){
        $('#recordTitle').text(newTitle);
    }
}

function removeRecord(index){// DOM only
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

function showChart(){
    var index = $(this).closest('.record').attr('data-index');
    var chartPanel = $('.chart-panel.'+index);
    chartPanel.toggleClass('show');
    drawChart(chartPanel.find('canvas'), index);
    chartPanel.find('.loading').removeClass('d-flex').addClass('d-none');
    chartPanel.find('.container').removeClass('hide');
}

function closeChartpanel(){
    $(this).closest('.chart-panel').removeClass('show');
}

function drawChart(element, index){
    var labels = [], data = [];
    console.log("drawing chart: ");
    var ind = 0;
    if(STORE.history.all[index].logs.length >= 30){
        ind = STORE.history.all[index].logs.length - 30;
    }
    STORE.history.all[index].logs.splice(ind).forEach((el, i) => {//console.log(i, el);
        labels.push(new Date(el.date).getDate()+'/'+(new Date(el.date).getMonth()+1));
        data.push(el.value);
    }); //console.log("labels", labels, "data", data);
    var myChart = new Chart(element, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '# of Votes',
                data: data,
                backgroundColor: '#919877',
                borderColor: '#c6ff00',
                lineTension: .2,
                borderWidth: '10',
                pointBorderColor: 'blue',
                pointBackgroundColor: 'blue',
                pointHitRadius: '50',
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        fontSize: '50'
                    },
                    gridLines: {
                        display: true,
                        color: '#777',
                        lineWidth: '2',
                        z: '1'
                    },
                }],
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        fontSize: '50'
                    },
                    gridLines: {
                        display: true,
                        color: '#777',
                        lineWidth: '2',
                        z: '1'
                    },
                }],
            },
            // responsive: true,
            // responsiveAnimationDuration: 2000,
            maintainAspectRatio: false
        }
    });
    Chart.defaults.global.defaultFontFamily = 'Lalezar';
    Chart.defaults.global.defaultFontColor = '#c6ff00';
}

function newID(arr, idProp){
    if(arr === undefined) arr = STORE.records;
    if(idProp === undefined) idProp = 'id';
    return arr[arr.length-1][idProp] + 1;
}

window.onload = init();