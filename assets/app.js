var counter, total, selectedRecord, selectedIndex, activeChanged, cookieOptions, $total, $progress, $counter, $today, $user, $panel, $chartPanel, $loginPanel, $chart, $panelRecord, $templates, db, STORE, dbCollection;

function init() {
    initDB();
    if(!isLoggedIn()){
        showLoginPanel();
    }
    else{
        console.log("Welcome back " + STORE.id + '!!' , 'STORE', STORE); 
        fetchData();
    }
}

function initListeners(){
    $('body').on('click', function(e) {e.stopPropagation();});
    $('#clicker').on('mouseup', increaseCounter);
    $('#reset').on('click', reset);
    $('#showPanel').on('click', onShowPanel);
    $('#closePanel').on('click', onClosePanel);
    $('#add-record-btn').on('click', createRecord);
    $('button.details').on('click', toggleDropdown);
    $('.record-body').on('click', onClickRecordBody);
    $('.changeTitle').on('click', changeTitle);
    $('.changeGoal').on('click', changeGoal);
    $('.deleteRecord').on('click', deleteRecord);
    $('#showPrayers').on('click', showPrayers);
    $('#showAddRecord, #hideAddRecord').on('click', toggleAddRecord);
    $('.showChart').on('click', showChart);
    $('#logout').on('click', logout);
    $chartPanel.find('.close').on('click', closeChartpanel);
    $chartPanel.find('select.showBy').on('change', onChangeShowBy);
    $('body').addClass('animated');
}

function fillValues(){
    counter = 0;
    cookieOptions = {expires: 3650};
    $total = $("#total");
    $progress = $("#progress");
    $counter = $("#counter");
    $user = $("#user");
    $today = $("#today");
    $title = $("#recordTitle");
    $panel = $('#panel');
    $templates = $('#templates');
    $chartPanel = $('#chart-panel');

    if(STORE.history === undefined) STORE.history = new History();// All histories of records
    if(STORE.selectedIndex === undefined) STORE.selectedIndex = 0;
    if(STORE.history.logBooks === undefined) STORE.history.logBooks = [];
    if(STORE.records === undefined) {
        alert("No records yet. Create one ! e.g. أستغفر الله");
        var newRec = new Record(1);
        STORE.records = [newRec];
        STORE.selectedIndex = 0;
        selectedRecord = newRec;
        selectedIndex = 0;
        console.log("records init", STORE.records); 
    }
    /* insure that every record has Logbook */
    $.each(STORE.records, function(i, rec){
        if(rec == null){ // empty records
            delete STORE.records[i];
            console.log("deleted record becuse it's null!", ); 
        }else{
            if(!STORE.history.logBooks.some(el => el.recordId == rec.id)){
                console.log("Generating daily Log for record ("+rec.title+")");
                STORE.history.logBooks.push(new Logbook(rec.id));
            }
        }
    });
    if(STORE.records[STORE.selectedIndex] == null){
        STORE.selectedIndex = 0;
    } 
    selectedIndex = STORE.selectedIndex; // verify if selectedIndex was not found
    selectedRecord = STORE.records[selectedIndex];
    activeChanged = false; // must be after fillSelectedRecord()   
    logging();
    fillSelectedRecord();
}

function fillSelectedRecord(){
    $title.text(selectedRecord.title);
    $counter.text(selectedRecord.counter);
    $today.text((selectedRecord.counterLog === undefined) ? 0 : selectedRecord.counterLog);
    $total.text(selectedRecord.total);
    $progress.find('.percent').text(goalPercent()+'%');
    $user.text(STORE.id);
    setProgress(goalPercent());
    activeChanged = true;
}

function goalPercent(counterLog, goal){
    if(counterLog === undefined) counterLog = parseInt(selectedRecord.counterLog);
    if(goal === undefined) goal = parseInt(selectedRecord.goal);
    if(counterLog == 0) 
        return 0;
    if(goal == 0 || goal === null || goal === undefined) 
        goal = 100;
    return parseInt(counterLog/goal*100);
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
    STORE.selectedIndex = selectedIndex;
    saveDB();
}

function increaseCounter(){
    selectedRecord.counter++; 
    selectedRecord.total++;
    selectedRecord.counterLog++;
    // var refreshPercent = selectedRecord.counterLog % 10 == 0;
    var today = selectedRecord.counterLog % 10 == 0 ? selectedRecord.counterLog : undefined;
    setProgress(goalPercent(), true, today);
    saveSelectedRecord();
    if(selectedRecord.counter % 10 == 0) $counter.text(selectedRecord.counter);
    if(selectedRecord.counter % 100 == 0) pulse($counter, 1);
    if(selectedRecord.counterLog % 100 == 0) pulse($today, 2);
    if(selectedRecord.total % 100 == 0){
        $total.text(selectedRecord.total);
        pulse($total, 1);
    }
}

function setProgress(value, refreshPercent, today){
    if(refreshPercent === undefined) refreshPercent = false;
    if(today === undefined) today = -1;
    if(refreshPercent){
        $progress.find('.percent').text(value+'%');
    }
    if(today != -1){
        $today.text(today); 
    }
    if(value >= 100) $progress.addClass('color-green').find('.val').attr('class', 'val c-100 goal-achieved');
    else $progress.removeClass('color-green').find('.val').attr('class', 'val c-'+(value%100));
    pulse($progress);
}

function reset(){
    selectedRecord.counter = 0; 
    $counter.text(0);
    setProgress(goalPercent());
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
    STORE.records.forEach((record, i) => {
        addRecordToPanel(record, i);
    });
}

function addRecordToPanel(record, index){
    console.log(record); 
    var tpl = $templates.find('.record-tpl').clone(true);
    tpl.attr('data-id', record.id).attr('data-title', record.title || 'N/A').attr('data-counter-log', record.counterLog || 0).attr('data-goal', record.goal || 100);
    tpl.removeClass('d-none record-tpl').addClass('record').toggleClass('color-primary active', selectedRecord.id == record.id);
    tpl.find('.title .label').text(record.title);
    var percent = goalPercent(record.counterLog, record.goal);
    tpl.find('.progress').text(percent+'%');
    tpl.find('.goal').text('DAILY GOAL '+record.goal);
    tpl.find('.today').text((record.counterLog || 0) + ' today');
    tpl.find('.total').text('TOTAL ' + record.total);
    tpl.find('.title i.done').toggleClass('d-none', percent < 100);
    tpl.prependTo( $panel.find('.records') );
}

function createRecord(){
    var $input = $('#add-record-input');
    if($input.val().length == 0){
        $input.attr('placeholder', 'Empty title entered!');
    }
    else{
        pulse($(this), 1);
        var newRecord = new Record(autoID(), $input.val());
        STORE.records.push(newRecord);
        addRecordToPanel(newRecord, STORE.records.length-1);
        STORE.history.logBooks.push(new Logbook(newRecord.id, new Log(new Date().toLocaleString("en"), newRecord.counter)));
        saveDB();
        $input.val('');
        pulse($panel.find('.record').first(), 1);
    }
    pulse($input);
    pulse($(this), 1);
    $input.focus();
}

function saveSelectedRecord(){
    STORE.records[selectedIndex] = selectedRecord;
    saveDB();
}

function logging(){
    var today = new Date();
    var lastWriting = new Date(Date.parse(STORE.history.lastWriting));
    if(lastWriting.getDate() != today.getDate() || lastWriting.getMonth() != today.getMonth() || lastWriting.getFullYear() != today.getFullYear()){
        STORE.history.lastWriting = today.toLocaleString("en"); // timestamp
        console.log("History is lastWritten today", today.toLocaleString("en"));
        $.each(STORE.records, function(i, rec){
            if(rec == null) return;
            $.each(STORE.history.logBooks, function(j, logBook){
                if(rec.id == logBook.recordId && rec.counterLog > 0){ // no logging if today's log is 0
                    var yesterday = new Date();
                    yesterday.setDate(yesterday.getDate()-1);
                    logBook.logs.push(new Log(yesterday.toLocaleString("en")/* timestamp */, rec.counterLog)); // save the daily every time you save
                    rec.counterLog = 0;
                }
            });
        });
        saveDB();
        console.log("Logging saved! history: ", STORE.history);
        /* BACKUP_DATABASE() */
        BACKUP_USER(STORE.history.lastWriting);
    }
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
    // pulse($rec);
    onClosePanel();
}

function recIndexByID(id){
    return STORE.records.findIndex(el => el.id == id);
}

function changeTitle(){
    var $rec = $(this).closest('.record');
    var newTitle = prompt("New title:", $rec.attr('data-title'));
    while(newTitle != null/*cancelled*/ && newTitle.trim() == ''){
        alert('You cannot enter an empty title!');
        newTitle = prompt("New title:", $rec.attr('data-title'));
    }
    var index = recIndexByID($rec.attr('data-id'));
    STORE.records[index].title = newTitle;
    setRecordTitle($rec.attr('data-id'), newTitle); // DOM
    saveDB();
}

function changeGoal(){
    var $rec = $(this).closest('.record');
    var newGoal = prompt("New Daily Goal:", $rec.attr('data-goal'));
    if(newGoal == null) return;
    while(newGoal.trim() == '' || newGoal === parseInt(newGoal, 10)/*is int*/){
        alert('The goal must be a number!');
        newGoal = prompt("New Goal:", $rec.attr('data-goal'));
    }
    var index = recIndexByID($rec.attr('data-id'));
    STORE.records[index].goal = parseInt(newGoal);
    var percent = goalPercent();
    setProgress(percent, true);
    $rec.attr('data-goal', newGoal);
    $rec.find('.goal').text('GOAL ' + newGoal);
    $rec.find('.progress').text(goalPercent($rec.attr('data-counter-log'), newGoal)+'%');
    $rec.find('.title i.done').toggleClass('d-none', percent < 100);
    saveDB();
}

function deleteRecord(){
    var $rec = $(this).closest('.record');
    if($('.record').length == 1){
        alert("Delete aborted. It is the only record you have..");
    }
    else if(confirm('Are you sure to delete "' + $rec.attr('data-title') + '"?')){
        var _data_id = $rec.attr('data-id');
        STORE.records = STORE.records.filter(el => el.id != _data_id);
        STORE.history.logBooks = STORE.history.logBooks.filter(el => el.recordId != _data_id);
        $('#record-'+_data_id).remove();
        $('.record[data-id='+_data_id+']').remove();
        if(_data_id == selectedRecord.id){
            selectRecord(); // the first index
            fillSelectedRecord();
        }
        saveDB();
    }
}

function setRecordTitle(id, newTitle){ // DOM only
    $('[data-id="'+id+'"]').find('.title .label').text(newTitle);
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

function onChangeShowBy(){
    $chartPanel.find('.chart-container canvas').remove();
    var showBy = $(this).val();
    $chartPanel.find('.loading').addClass('d-flex').removeClass('d-none');
    $chartPanel.find('.container').addClass('hide');
    drawChart($chartPanel.attr('data-rec-id'), showBy);
    $chartPanel.find('.loading').removeClass('d-flex').addClass('d-none');
    $chartPanel.find('.container').removeClass('hide');
}

function showChart(){
    if($(this).closest('.record').attr('data-id') !== undefined){
        $chartPanel.attr('data-rec-id', $(this).closest('.record').attr('data-id'));
    }
    $chartPanel.find('select.showBy').val("5-days").trigger('change');
    $chartPanel.toggleClass('show');
}

function closeChartpanel(){
    $chartPanel.find('.chart-container canvas').remove();
    $chartPanel.removeClass('show');
}

function drawChart(recID, showBy){
    if(showBy === undefined) showBy = "5-days";
    var logBook = STORE.history.logBooks.find(el => el.recordId == recID);
    if(logBook === undefined){
        alert("No data was found for this record");
        closeChartpanel();
        return;
    }
    var dataPoints = [];
    var today = new Date();
    var d = new Date();
    if(logBook.logs.length == 0){ /* if record has been just created */
        dataPoints.push({x: today, y: 0});
    }
    var index = 0;
    var startDate = new Date();
    var chartX = 0;
    var maxVal = 0;
    function getIntervalY(){
        if(maxVal <= 10){
            return 1;
        }else if(maxVal <= 20){
            return 2;
        }else if(maxVal <= 50){
            return 5;
        }else if(maxVal <= 100){
            return 10;
        }else if(maxVal <= 200){
            return 20;
        }else if(maxVal <= 500){
            return 50;
        }else{
            return Math.ceil(maxVal/1000) * 100;
        }
    }
    function makeChartData(chX){
        chartX = chX - 1;
        startDate.setDate(today.getDate() - chartX);
        var _date = startDate;
        for(var i = 0; i < chartX; i++){
            var log = logBook.logs.find(el => new Date(el.date).getDate() == _date.getDate() && new Date(el.date).getMonth() == _date.getMonth() && new Date(el.date).getFullYear() == _date.getFullYear());
            var point = {};
            if(log !== undefined){
                point.y = log.value;
            }
            else{
                point.y = 0;
            }
            point.x = new Date(_date.getFullYear(), _date.getMonth(), _date.getDate());
            dataPoints.push(point);
            if(point.y > maxVal) maxVal = point.y;
            _date.setDate(_date.getDate() + 1);
        }
    }
    switch(showBy){
        case "5-days":
            makeChartData(5);
            break;
        case "30-days":
            makeChartData(30);
            break;
        default:
            //
            break;
    }
    /* Add today to chart */
    var rec = STORE.records.find(el => el.id == recID);
    dataPoints.push({x: new Date(today.getFullYear(), today.getMonth(), today.getDate()), y: rec.counterLog});
    if(rec.counterLog > maxVal) maxVal = rec.counterLog;
    
    console.log("maxVal", maxVal, "dataPoints", dataPoints); 
    var title = {'5-days': 'Last 5 days', '30-days': 'Last 30 days'};
    var chart = new CanvasJS.Chart("chart-container", { /* https://canvasjs.com/jquery-charts/dynamic-chart/ */
        animationEnabled: true,
        backgroundColor: "#2f2f2f",
        title: {
            text: rec.title,
            fontColor: "#c6ff00",
            fontSize: '60'
        },
        axisX:{
            title: title[showBy],
            titleFontColor: "#c6ff00",
            labelFontColor: "#c6ff00",
            labelAngle: 70,
            valueFormatString: "DD/MM",
            gridThickness: 1,
            interval: 1,
            intervalType: "day",
        },
        axisY:{
            labelFontColor: "#c6ff00",
            scaleBreaks: {
                auoCalculate: true,
                spacing: 4,
                type: "zigzag",
            },
            interval: getIntervalY(),
            maximum: maxVal+1
        },
        toolTip:{
            enabled: true,
            animationEnabled: true,
            fontColor: "#c6ff00",
            fontSize: 60,
            backgroundColor: "#2f2f2f80", // with opacity
            contentFormatter: function (e) {
                var content = " ";
                e.entries.forEach(el => {
                    content += "<strong>" + el.dataPoint.y + "</strong>: <small>" + el.dataPoint.x.toLocaleDateString("en") + "</small>";
                });
				return content;
			}
        },
        data: [
            {
                type: "area", // line, area, spline
                dataPoints: dataPoints,
                axisXIndex: 0, //defaults to 0
                // showInLegend: true,
                color: "#c6ff00",
                markerSize: 15,
                markerColor: "green",
                lineThickness: 5,
                fillOpacity: .2,
            }
        ],
        // width: 100,
        height: 500
    });
    chart.render();
    console.log("Chart done!");
}

function autoID(arr, idProp){
    if(arr === undefined) arr = STORE.records;
    if(idProp === undefined) idProp = 'id';
    return Math.max.apply(Math, arr.map(function(el){ return el[idProp]; })) + 1;
}
// =========================================== DATABASE ==========================================
function initDB(){
    firebase.initializeApp({
        apiKey: 'AIzaSyBP196irDbj3NgzWnTggEV_5XQJlNhRL5k',
        authDomain: 'test-firebase-597da.firebaseapp.com',
        projectId: 'test-firebase-597da'
    });
    db = firebase.firestore();
    dbCollection = db.collection("counter-users");
    STORE = {};
}

function _fetchDB(){
    return dbCollection.where("id", "==", STORE.id).get();
}

function fetchData(){
    _fetchDB().then(function(querySnapshot) {
            querySnapshot.forEach(function(doc) {
                STORE = doc.data(); // STORE.id = doc.id;
                return;
            });
            fillValues();
            if(selectedRecord === undefined){
                setProgress(0);
            }else{
                setProgress(goalPercent());
            }
            initListeners();
            console.log("Connected to Muhannad-Counter database!"); 
        })
        .catch(function(error){
            console.error(error);
            alert("Error occured when loading data!");
        });
}

function showLoginPanel(){
    $('#login').on('click', login);
    $loginPanel = $('#login-panel');
    $loginPanel.addClass('show');
    $loginPanel.find('.username').focus();
}

function isLoggedIn(){
    STORE.id = Cookies.get("userID");
    return !(STORE.id === undefined || STORE.id == null || STORE.id == '');
}

function login(){
    if(STORE == null) STORE = {};
    STORE.id = $loginPanel.find('.username').val() || false;
    if(STORE.id != null){
        fetchData();
        Cookies.set("userID", STORE.id);
        $loginPanel.removeClass('show');
    }
    else{
        alert("Cannot login! Please provide all login fields.");
    }
}

function saveDB(){
    if(STORE.records === undefined || STORE.records.length == 0){
        alert("Cannot save empty STORE!");
        return;
    }
    dbCollection.doc(STORE.id).set(JSON.parse(JSON.stringify(STORE)))
        .then(function() {
            console.log("DB saved. STORE: ", STORE);
        })
        .catch(function(error) {
            console.error("Error saving DB: ", error);
        });
}

function logout(){
    Cookies.set("userID", '');
    window.location = window.location;
}

function BACKUP_DATABASE(){
    var users = [];
    dbCollection.get().then(function(querySnapshot){
        querySnapshot.docs.map(doc => users.push(doc.data()));
        console.log(JSON.stringify(users));
    });
}

function BACKUP_USER(lastWriting){
    var _db = firebase.firestore();
    _db.collection("_BACKUP-counter-users").where("id", "==", STORE.id).get().then(function(querySnapshot){
        querySnapshot.forEach(function(doc) {
            lastWriting = new Date(Date.parse(lastWriting));
            var lastBackup = new Date(doc.data().history.lastWriting) || false;
            console.log("lastBackup", lastBackup); 
            if(!lastBackup){
                alert("Couldn't take auto backup!");
                return;
            }
            if(lastWriting.getDate() != lastBackup.getDate() || lastWriting.getMonth() != lastBackup.getMonth() || lastWriting.getFullYear() != lastBackup.getFullYear()){
                console.log("lastBackup", lastBackup); 
                _db.collection("_BACKUP-counter-users").doc(STORE.id).set(JSON.parse(JSON.stringify(STORE)))
                    .then(function() {
                        console.log("User auto backup was taken!", STORE);
                    })
                    .catch(function(error) {
                        console.error("Backup unsuccessfull! ", error);
                        alert("Backup unsuccessfull! " + error);
                    });
            }
            return;
        });
    })
    .catch(function(error) {
        console.error("Error backing up User: ", error);
        alert("Couldn't take auto backup! " + error);
    });
}

window.onload = init();

/* 
    VERSIONS:
        v1   : simple counter with circle.
        v2   : records objects & panel.
        v3   : logs, charts & prayer-times page.
        v4   : advanced charts.
        v5   : data stored on cloud firebase, no login required, but some kind of security. offline cache can be provided with firebase.
        v5.3 : log in and out and provide user info: name, email, pass, backup
        v5.5 : set record goal, progress comes from it
        v6   : auto user backup on logging everyday!
        
    FUTURE VERSIONS:
        v8 : GROUPS
*/