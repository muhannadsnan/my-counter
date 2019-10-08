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
var counter, total, cookieCounter, $totalDiv, $progress, $progressSpan, progressIncBy, $panel, states;

function init() { 
    initValues();
    if( cookieCounter == 0 || !cookieCounter){
        setProgress(0);
    }else{
        counter = cookieCounter;                    
        setProgress(counter);
    }
    loadData();
    $('#showPanel').on('click', onShowPanel);
    $('#closePanel').on('click', onClosePanel);
    $('#add-state-btn').on('click', createState);
}

function initValues(){
    counter = 0;
    total = Number(getCookie("total"));
    $totalDiv = $("#total");
    $progress = $("#Progress");
    $progressSpan = $("#progressSpan");
    $panel = $('#panel');
    $totalDiv.textContent = total;
    progressIncBy = 1;
    cookieCounter = Number(getCookie("counter"));
}

function increaseCounter(){
    counter++; 
    total++;
    if(counter % 10 == 0){
        setProgress(counter);
    }else{
        setProgress(counter, false);
    }
    if(total % 100 == 0){
        $totalDiv.textContent = total;
        setProgress(0, false);
    }
    setCookie("counter", counter, 30);
    setCookie("total", total, 3650);
}

function setProgress(number, withNumber){ 
    if(withNumber === undefined) withNumber = true;
    if(withNumber){
        $progressSpan.textContent = number; 
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
    showStates(states);    
}

function onClosePanel(){
    togglePannel();
}

function showStates(states){ 
    clearStatesDom(); 
    $.each(states, function(i, el){
        var state = $('.state-tpl').clone(true);
        state.removeClass('state-tpl d-none').addClass('state');
        state.find('.text').text(el.title +' '+ el.counter);
        state.prependTo( $panel.find('.all-states') );
    });
}

function clearStatesDom(){
    $panel.find('.state').remove();  
}

function loadData(){
    /* https://www.npmjs.com/package/js-cookie */
    states = Cookies.getJSON('states');
    states = [{title: 'first state', counter: 100}, {title: 'second state', counter: 200}, {title: 'third state', counter: 500}];
    console.log("states", states); 
}

function createState(){
    var $input = $('#add-state-input');
    var newState = {title: $input.val(), counter: 0};
    states.unshift(newState);
    showStates(states);
    $input.val('');
}


window.onload = init();

/* 
    TODO:
    - add button for config, that shows a panel to manage states
    - a state will have own counter
    - states can be created with a title
    - cookie values are saved for today, week, month, and all-time, for each state
    - graphs are shown for each state
*/