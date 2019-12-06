var counter, total, currentCounter, $total, $progress, $counter, $panel, STORE, selectedRecord, selectedIndex, activeChanged, cookieOptions;

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
    $('.chart .close').on('click', function(){ $(this).closest('.dropdown').find('.chart').removeClass('show'); });
    // pulseAll();
    animateStart();
}

function initValues(){
    counter = 0;
    cookieOptions = {expires: 3650};
    $total = $("#total");
    $progress = $("#progress");
    $counter = $("#counter");
    $title = $("#recordTitle");
    $panel = $('#panel');
    
    STORE = Cookies.getJSON();
    if(STORE.store !== undefined){
        var rec = STORE.store.records;
        var ind = STORE.store.selectedIndex;
        STORE.records = rec;
        STORE.selectedIndex = ind;
        console.log("An old store structure found..", STORE); 
        saveSTORE();
        console.log("The old store was migrated and saved!"); 
        Cookies.remove('store');
        console.log("Old store removed........." ); 
    }
    if(STORE.selectedIndex === undefined) {
        STORE.selectedIndex = 0;
    }
    if(STORE.history === undefined) { // All histories of records
        STORE.history = {};
        STORE.history.all = [];
        STORE.history.lastWriting = 0;
    }
    if(STORE.records === undefined) {
        var title = prompt("No records yet. Create one !", 'أستغفر الله');
        STORE.records = [new Record(title)];
        STORE.selectedIndex = 0;
    }
    /* insure that every record has Logbook */
    $.each(STORE.records, function(i, rec){ 
        console.log(!STORE.history.all.some(x => x.recordId == rec.id))
        if(!STORE.history.all.some(x => x.recordId == rec.id)){ 
            STORE.history.all.push(new Logbook(rec.id));
        }
    });
    activateRecord(STORE.selectedIndex);
    activeChanged = false; // must be after activateRecord()    
    saveSTORE("logging");
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
    tpl.find('.counter').text(newRecord.counter);
    tpl.find('.total').text(newRecord.total);
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
        var newRecord = new Record($input.val());
        STORE.records.push(newRecord);
        addRecordToPanel(newRecord, STORE.records.length-1);
        saveSTORE("all", newRecord); // records + history but not logging
        $input.val('');
        pulse($panel.find('.record').first(), 1);
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
    else if(toSave == "logging"){ // logging
        var today = new Date();
        var lastWriting = new Date(STORE.history.lastWriting);
        console.log("|||||||||||||||||||||||||||||||", STORE.history.lastWriting); 
        console.log("", today.getDate(), today.getMonth(), today.getFullYear()); 
        console.log("", lastWriting.getDate(), lastWriting.getMonth(), lastWriting.getFullYear()); 
        console.log(lastWriting.getDate() != today.getDate() || lastWriting.getMonth() != today.getMonth() || lastWriting.getFullYear() != today.getFullYear());
        if(lastWriting.getDate() != today.getDate() || lastWriting.getMonth() != today.getMonth() || lastWriting.getFullYear() != today.getFullYear()){
            STORE.history.lastWriting = Date.now(); // timestamp
            console.log("History is lastWritten today", lastWriting);
            $.each(STORE.records, function(i, rec){ 
                $.each(STORE.history.all, function(j, logBook){
                    if(rec.id == logBook.recordId){
                        logBook.logs.push(new Log(Date.now(), rec.counter)); // save the daily every time you save
                    }
                });
            });
        }
        console.log("|||||||||||||||||||||||||||||||", STORE.history.lastWriting); 
        console.log("", today.getDate(), today.getMonth(), today.getFullYear()); 
        console.log("", lastWriting.getDate(), lastWriting.getMonth(), lastWriting.getFullYear()); 
        console.log(lastWriting.getDate() != today.getDate() || lastWriting.getMonth() != today.getMonth() || lastWriting.getFullYear() != today.getFullYear());
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

function showPrayers(){
    window.location = "./prayers.html";
}

function toggleAddRecord(){
    $panel.toggleClass('showAddRecord');
    $panel.find('#showAddRecord').toggleClass('d-none');
    $panel.find('#hideAddRecord').toggleClass('d-none');
    pulse($('#showAddRecord, #hideAddRecord'), 2);
}

function animateStart(){
    setTimeout(function(){
        $('#showPanel').css('top', '0');
        setTimeout(function(){
            $('#counter').css('top', '3rem');
            setTimeout(function(){
                $('#reset').css('top', '0');
                //-----------------
                setTimeout(function(){
                    $('#progress').css('left', '1rem');
                    setTimeout(function(){
                        $('#recordTitle').css('right', '0');
                        setTimeout(function(){
                            $('#total').css('right', '0');
                            //-----------------
                            setTimeout(function(){
                                $('footer').css('bottom', '0');
                            }, 1000);
                        }, 100);
                    }, 100);
                }, 100);
            }, 100);
        }, 100);
    }, 200);
}

function uniqID(){
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function showChart(){
    $element = $(this).closest('.dropdown').find('.chart');
    $element.addClass('show');
    drawChart($element.find('canvas'));
}

function drawChart(element){
    var labels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];
    var data = [1000, 3000, 500, 765, 1200, 3500];
    var myChart = new Chart(element, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '# of Votes',
                data: [1000, 3000, 500, 765, 1200, 3500],
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

            responsive: true,
            responsiveAnimationDuration: 2000,
            maintainAspectRatio: false
        }
    });
    
    Chart.defaults.global.defaultFontFamily = 'Lalezar';
    Chart.defaults.global.defaultFontColor = '#c6ff00';
}

window.onload = init();