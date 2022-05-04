var hasInitializedListeners = false, STORE, counter, total, selectedRecord, activeChanged, cookieOptions, $percent, $progress, $counter, $today, $week, $total, $user, $panel, $chartPanel, $authPanel, $chart, $templates, db, firebase_db, dbCollection, isTouched, timeout, delayRefreshArr, USER, TOKEN;

function init() {
    TOKEN = Cookies.get('token') || undefined;
    USER = Cookies.get('user') || null; // dont pass undefined here!
    USER = JSON.parse(USER) || undefined;
    if(TOKEN && USER){
        db = new Database();
        db.x_signin();
        console.log('User "'+USER.email+'" is logged in.');
    }
    else{
        bootApp();
    }
}

function initListeners(){
    $('body').on('click', function(e) {e.stopPropagation();});
    $('#clicker').on('click touchend', increaseCounter);
    $('#reset').on('click', reset);
    $('#showPanel').on('click', showPanel);
    $('#closePanel').on('click', closePanel);
    $('.close').on('click', function(){ $(this).parent().parent().toggleClass('show') });
    $('#add-record-btn').on('click', createRecord);
    $('button.details').on('click', toggleDropdown);
    $('.record-body').on('click', onClickRecordBody);
    $('.changeTitle').on('click', changeTitle);
    $('.changeGoal').on('click', changeGoal);
    $('.deleteRecord').on('click', deleteRecord);
    $('#showPrayers').on('click', showPrayers);
    $('#showSettings').on('click', toggleSettings);
    $('#hideSettings').on('click', closeSettings);
    $('#chkDelayRefresh').on('click', toggleDelayRefresh);
    $('.showChart').on('click', showChart);
    $('#showAuthBtn').on('click', login);
    $('.signin').on('click', signin);
    $('.signout').on('click', signout);
    $('#logoutBtn').on('click', logout);
    $chartPanel.find('.close').on('click', closeChartpanel);
    $chartPanel.find('select.showBy').on('change', onChangeShowBy);
    $('body').addClass('animated');
    hasInitializedListeners = true;
}

function fillValues(){
    counter = 0;
    cookieOptions = {expires: 3650};
    $today = $("#today");
    $week = $("#week");
    $total = $("#total");
    $percent = $("#percent");
    $progress = $("#progress");
    $counter = $("#counter");
    $user = $("#user");
    $title = $("#recordTitle");
    $panel = $('#panel');
    $templates = $('#templates');
    $chartPanel = $('#chart-panel');
    isTouched = false;

    if(!isLoggedIn()){
        STORE = Cookies.get();
        if(STORE.records !== undefined) STORE.records = JSON.parse(STORE.records);
        if(STORE.history !== undefined) STORE.history = JSON.parse(STORE.history);
    }
    if(STORE === undefined) STORE = {};
    if(STORE.history === undefined) STORE.history = new History();// All histories of records
    if(STORE.history.logBooks === undefined) STORE.history.logBooks = [];
    if(STORE.selectedIndex === undefined) STORE.selectedIndex = 0;
    if(STORE.records === undefined) {
        alert("No records yet. Create one ! e.g. أستغفر الله");
        var newRec = new Record(1);
        STORE.records = [newRec];
        STORE.selectedIndex = 0;
    }
    if(USER === undefined) USER = new User();
    /* ensure that every record has Logbook */
    $.each(STORE.records, function(i, rec){
        if(rec == null){ // delete empty records
            delete STORE.records[i];
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
    selectedRecord = STORE.records[STORE.selectedIndex];
    activeChanged = false;
    fillSelectedRecord();
    $user.text(isLoggedIn ? USER.displayName : 'Guest');
    $panel.find('.login-buttons-container').toggleClass('d-none', isLoggedIn());
    $panel.find('#logoutBtn').toggleClass('d-none', !isLoggedIn());
    logging();
    if(STORE.settings === undefined){
        STORE.settings = new Settings();
    }
    save();
    delayRefreshArr = STORE.settings.delayRefresh ? [10, 100] : [1,1];
}

function fillSelectedRecord(){
    $title.text(selectedRecord.title);
    $counter.text(selectedRecord.counter);
    $today.text(selectedRecord.counterDay);
    $week.text(selectedRecord.counterWeek);
    $total.text( thousandFormat(selectedRecord.total) );
    var gPercent = goalPercent();
    $percent.text(gPercent+' %');
    setProgress(gPercent);
    activeChanged = true;
}

function setProgress(value, refreshPercent, counter, today, week, total){
    if(refreshPercent !== undefined) $percent.text(value+' %');
    if(counter !== undefined) $counter.text(counter);
    if(today !== undefined) $today.text(today); 
    if(week !== undefined) $week.text(week); 
    if(total !== undefined) $total.text( thousandFormat(total) ); 
    if(value >= 100) $progress.addClass('color-green').find('.val').attr('class', 'val c-100 goal-achieved');
    else $progress.removeClass('color-green').find('.val').attr('class', 'val c-'+(value%100));
    pulse($progress);
}

function goalPercent(counterDay, goal){
    if(counterDay === undefined) counterDay = parseInt(selectedRecord.counterDay);
    if(goal === undefined) goal = parseInt(selectedRecord.goal);
    if(counterDay == 0) 
        return 0;
    if(goal == 0 || goal === null || goal === undefined) 
        goal = 100;
    return parseInt(counterDay/goal*100);
}

function selectRecord(recID){
    if(recID === undefined){
        STORE.selectedIndex = 0;
        selectedRecord = STORE.records[0];
        return;
    }
    else{
        $.each(STORE.records, function(i, rec){
            if(rec.id == recID){
                STORE.selectedIndex = i;
                selectedRecord = rec;
                return false;
            }
        });   
    }
    save();
}

function increaseCounter(e){
    if(!(isTouched && e.type == 'click')){
        if(e.type == 'touchend') isTouched = true;
        if(selectedRecord.counter === undefined) selectedRecord.counter = 0;
        if(selectedRecord.counterDay === undefined) selectedRecord.counterDay = 0;
        if(selectedRecord.counterWeek === undefined) selectedRecord.counterWeek = 0;
        if(selectedRecord.total === undefined) selectedRecord.total = 0;
        selectedRecord.counter++; 
        selectedRecord.counterDay++;
        selectedRecord.counterWeek++;
        selectedRecord.total++;
        var counter = selectedRecord.counter % delayRefreshArr[0] == 0 ? selectedRecord.counter : undefined;
        var today = selectedRecord.counterDay % delayRefreshArr[0] == 0 ? selectedRecord.counterDay : undefined;
        var week = selectedRecord.counterWeek % delayRefreshArr[1] == 0 ? selectedRecord.counterWeek : undefined;
        var total = selectedRecord.total % delayRefreshArr[1] == 0 ? selectedRecord.total : undefined;
        setProgress(goalPercent(), true, counter, today, week, total);
        saveSelectedRecord();
        if(selectedRecord.counter % 100 == 0) pulse($counter, 1);
        if(selectedRecord.counterDay % 100 == 0) pulse($today, 2);
        if(selectedRecord.counterWeek % 100 == 0) pulse($week, 1);
        if(selectedRecord.total % 100 == 0) pulse($total, 1);
    }
}

function saveSelectedRecord(){
    STORE.records[STORE.selectedIndex] = selectedRecord;
    save();
}

function reset(){
    selectedRecord.counter = 0; 
    $counter.text(0);
    saveSelectedRecord();
}

function togglePannel(){
    if($panel.hasClass('show')){
        $panel.find('.settings').removeClass('show');
        $panel.find('#showSettings').removeClass('d-none');
    }
    $panel.toggleClass('show');
}

function showPanel(){
    togglePannel();
    showSettings();
    showRecords();    
}

function showSettings(){
    $('#chkDelayRefresh i.unchecked').toggleClass('d-none', STORE.settings.delayRefresh);
    $('#chkDelayRefresh i.checked').toggleClass('d-none', !STORE.settings.delayRefresh);
}

function closePanel(){
    pulse($('#showPanel'), 2);
    if(activeChanged){
        pulseAll();
        activeChanged = false;
    }
    togglePannel();
}

function showRecords(){
    $panel.find('.record').remove();
    $.each(STORE.records, function(i, record){
        addRecordToPanel(i, record);
    });
}

function addRecordToPanel(index, record){
    // console.log(record); 
    var tpl = $templates.find('.record-tpl').clone(true);
    tpl.attr('data-id', record.id).attr('data-title', record.title || 'N/A').attr('data-counter-log', record.counterDay || 0).attr('data-goal', record.goal || 100);
    tpl.removeClass('d-none record-tpl').addClass('record d-flex flex-col').toggleClass('color-primary active', selectedRecord.id == record.id);
    tpl.find('.title .label').text(record.title);
    var percent = goalPercent(record.counterDay, record.goal);
    tpl.find('.progress').text(percent+'%');
    tpl.find('.today').text((record.counterDay || 0) + ' today');
    tpl.find('.goal span').text(record.goal);
    tpl.find('.total span').text(record.total);
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
        addRecordToPanel(STORE.records.length-1, newRecord);
        STORE.history.logBooks.push(new Logbook(newRecord.id, new Log(new Date().toLocaleString("en"), newRecord.counter)));
        save();
        $input.val('');
        toggleSettings();
        selectRecord(newRecord.id);
        fillSelectedRecord();
        $panel.find('.record').removeClass('color-primary active').first().addClass('color-primary active');
        pulse($panel.find('.record').first(), 1);
    }
    pulse($input);
    pulse($(this), 1);
    // $input.focus();
}

function logging(){
    var today = new Date();
    var lastWriting = new Date(Date.parse(STORE.history.lastWriting));
    if(lastWriting.getDate() != today.getDate() || lastWriting.getMonth() != today.getMonth() || lastWriting.getFullYear() != today.getFullYear()){
        STORE.history.lastWriting = today.toLocaleString("en"); // timestamp
        console.log("History is lastWritten today", today.toLocaleString("en"));
        $.each(STORE.records, function(i, rec){
            if(rec == null) return;
            if(lastWriting.getWeekNumber() != today.getWeekNumber()){ // new week
                rec.counterWeek = 0;
                $week.text(0);
            }
            $.each(STORE.history.logBooks, function(j, logBook){
                if(rec.id == logBook.recordId && rec.counterDay > 0){ // no logging if today's log is 0
                    var yesterday = new Date();
                    yesterday.setDate(yesterday.getDate()-1);
                    logBook.logs.push(new Log(yesterday.toLocaleString("en")/* timestamp */, rec.counterDay)); // save the daily every time you save
                    rec.counterDay = 0;
                }
            });
        });
        save();
        console.log("Logging saved! history: ", STORE.history);
        if(isLoggedIn && db !== undefined){
            db.BACKUP_USER();
        }
        fillSelectedRecord(); /* to refresh cached page when loading app the next day */
    }
}

function toggleDropdown(){
    var $parent = $(this).closest('.record');
    $parent.toggleClass('showDropdown');
    $('.record').not($parent).removeClass('showDropdown');
}

function onClickRecordBody(){
    console.log("rec-body", ); 
    $('.record').removeClass('color-primary active');
    var $rec = $(this).closest('.record');
    $rec.addClass('color-primary active');
    selectRecord($rec.attr('data-id'));
    fillSelectedRecord();
    showRecords();
    // pulse($rec);
    closePanel();
}

function recIndexByID(id){
    return STORE.records.findIndex(el => el.id == id);
}

function changeTitle(){
    var $rec = $(this).closest('.record');
    var newTitle = prompt("New title:", $rec.attr('data-title'));
    while(newTitle.trim() === ''){
        alert('You cannot enter an empty title!');
        newTitle = prompt("New title:", $rec.attr('data-title'));
    }
    if(newTitle === null){ // cancelled
        return;
    }
    var index = recIndexByID($rec.attr('data-id'));
    STORE.records[index].title = newTitle;
    setRecordTitle($rec.attr('data-id'), newTitle); // DOM
    save();
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
    save();
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
            showRecords();
        }
        save();
    }
}

function setRecordTitle(id, newTitle){ // DOM only
    $('[data-id="'+id+'"]').attr('data-title', newTitle).find('.title .label').text(newTitle);
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
    pulse($title, 2);
    pulse($progress, 3);
    pulse($counter, 2);
    pulse($today, 2);
    pulse($week, 2);
    pulse($total, 2);
}

function showPrayers(){
    window.location = "./prayers.html";
}

function toggleSettings(){
    $panel.find('.settings').addClass('show');
    $panel.find('#showSettings').addClass('d-none');
    $panel.find('#add-record-input').focus();
    pulse($('#showSettings'), 2);
}

function closeSettings(){
    $panel.find('.settings').removeClass('show');
    $panel.find('#showSettings').removeClass('d-none');
    pulse($('#showSettings'), 2);
}

function toggleDelayRefresh(){
    STORE.settings.delayRefresh = !STORE.settings.delayRefresh;
    delayRefreshArr = STORE.settings.delayRefresh ? [10, 100] : [1, 1];
    $('#chkDelayRefresh i.unchecked').toggleClass('d-none', STORE.settings.delayRefresh);
    $('#chkDelayRefresh i.checked').toggleClass('d-none', !STORE.settings.delayRefresh);
    save();
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
    $chartPanel.find('select.showBy').val("7-days").trigger('change');
    $chartPanel.toggleClass('show');
}

function closeChartpanel(){
    $chartPanel.find('.chart-container canvas').remove();
    $chartPanel.removeClass('show');
}

function drawChart(recID, showBy){
    if(showBy === undefined) showBy = "7-days";
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
    var total = 0;
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
            total += point.y;
        }
        total += selectedRecord.counterDay;
        $("#chart-panel .total span").text(total);
    }
    switch(showBy){
        case "7-days":
            makeChartData(7);
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
    dataPoints.push({x: new Date(today.getFullYear(), today.getMonth(), today.getDate()), y: rec.counterDay});
    if(rec.counterDay > maxVal) maxVal = rec.counterDay;
    
    // console.log("maxVal", maxVal, "dataPoints", dataPoints); 
    var title = {'7-days': 'Last 7 days', '30-days': 'Last 30 days'};
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
    // console.log("Chart done!");
}
/******************************************/
function autoID(arr, idProp){
    if(arr === undefined) arr = STORE.records;
    if(idProp === undefined) idProp = 'id';
    return Math.max.apply(Math, arr.map(function(el){ return el[idProp]; })) + 1;
}

function thousandFormat(n){
    if (n < 1000) return n;
    else if (n >= 1000 && n < 1000000) return +(n / 1000).toFixed(1) + "K";
    else if (n >= 1000000 && n < 1000000000) return +(n / 1000000).toFixed(1) + "M";
}

function switchAuthPanel(){
    $('.switch-auth button').removeClass('active');
    $(this).addClass('active');
    $('#auth-panel .auth').removeClass('active');
    $('#auth-panel .auth.'+$(this).attr("data-auth")).addClass('active');
    $authPanel.find('.username').focus();
}

function bootApp(){
    fillValues();
    if(selectedRecord === undefined){
        setProgress(0);
    }else{
        setProgress(goalPercent());
    }
    if(!hasInitializedListeners){
        initListeners();
    }
    $panel.find('.settings').removeClass('show');
    $panel.find('#showSettings').removeClass('d-none');
}

function showAuthPanel(){
    $authPanel = $('#auth-panel');
    $('#auth-panel input').on('input keypress', validate_auth);
    $('#auth-panel .auth button.show-1').on('click', function(){ 
        $authPanel.find('.auth .swipe-container').removeClass('show-2'); 
        $authPanel.find('#loginBtn').prop('disabled', false).find('span').removeClass('d-none');
        $authPanel.find('#loginBtn').find('span.1.3, span.2.3, i.fa-spinner').addClass('d-none');
        $authPanel.find('.login-panel input[type=password]').val('');
    });
    $('#loginBtn').on('click', connectLogin);
    $('#register').on('click', function(){ db.register; });
    $('.switch-auth button').on('click', switchAuthPanel);
    $authPanel.addClass('show');
    $authPanel.find('.username').focus();
}

function validate_auth(e){
    if(e.type == "keypress" && (e.keyCode == 13)){
        $('#auth-panel .auth.active button.do-auth').trigger("click");
    }
    $authPanel.find('#loginBtn').prop('disabled', $(this).val().trim() == false);
    $authPanel.find('#register').prop('disabled', $(this).val().trim() == false);
}

function login(){
    showAuthPanel();
}

function connectLogin(){ 
    if(db === undefined){
        db = new Database();
    }
    db.login(); 
}

function isLoggedIn(){
    return !(TOKEN === undefined || TOKEN === '' || USER === undefined || USER.email === 'null');
}

function logout(){
    db.signOut();
    TOKEN = null;
    USER = new User();
    if(Cookies.get("token") !== undefined && Cookies.get("token") !== "") Cookies.remove("token");
    if(Cookies.get("user") !== undefined && Cookies.get("user") !== "") Cookies.remove("user");
    window.location = window.location;
}

function save(toSave){
    if(isLoggedIn()){
        db.save();
    }else{
        saveSTORE(toSave);
    }
}

function saveSTORE(toSave){
    if(toSave === undefined) toSave = "all";
    if(toSave == "all" || toSave == "records"){
        Cookies.set("records", STORE.records, cookieOptions);
    }
    if(toSave == "all" || toSave == "selectedIndex"){
        Cookies.set("selectedIndex", STORE.selectedIndex, cookieOptions);
    }
    if(toSave == "all" || toSave == "history"){
        Cookies.set("history", STORE.history, cookieOptions);
    }
    if(toSave == "logging"){
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
    console.log(toSave == "all" || toSave == "records" ? 'records':'', toSave == "all" || toSave == "selectedIndex" ? 'selectedIndex':'', toSave == "all" || toSave == "history" ? 'history':'', 'saved !'); 
}

function signin(){
    if(db === undefined){
        db = new Database();
    }
    var provider;
    if($(this).data('signin-type') == 'google'){
        provider = new firebase.auth.GoogleAuthProvider();
    }
    else if($(this).data('signin-type') == 'facebook'){
        provider = new firebase.auth.FacebookAuthProvider();
    }
    provider.addScope('email');
    db.do_signin(provider);   
}

function signout(){
    if(db === undefined){
        db = new Database();
    }
    db.signOut();
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
        v7.4 : can use as guest user
        v8.0 : signin with google, use promise
        
    FUTURE VERSIONS:
        v8 : GROUPS
*/