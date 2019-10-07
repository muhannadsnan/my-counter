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
var counter = 0, total = Number(getCookie("total")), cookieCounter = Number(getCookie("counter")),
totalDiv = document.getElementById("total"),
progress = document.getElementById("Progress"),
progressSpan = document.getElementById("progressSpan"),
progressIncBy = 1,
panel = $('#panel'),
states = ['first state', 'second state', 'third state'];

function init() { 
    // console.log("cookie", document.cookie);
    // console.log("counter", cookieCounter);
    if( cookieCounter == 0 || !cookieCounter){
        // numberDiv.innerHTML = '<span id="startSpan">START!</span>';
        setProgress(0);
    }else{
        counter = cookieCounter;                    
        // numberDiv.textContent = counter;
        setProgress(counter);
    }
    totalDiv.textContent = total;
    $('#showPanel').on('click', onShowPanel);
    $('#closePanel').on('click', onClosePanel);
}

function increaseCounter(){
    counter++; // console.log(counter);
    total++;
    if(counter % 10 == 0){
        // numberDiv.textContent = counter;
        setProgress(counter);
    }else{
        setProgress(counter, false);
    }
    if(total % 100 == 0){
        totalDiv.textContent = total;
        setProgress(0, false);
    }
    setCookie("counter", counter, 30);
    setCookie("total", total, 3650);
}

function setProgress(number, withNumber=true){ 
    if(withNumber){
        progressSpan.textContent = number; 
    }
    progress.className = 'c100 big dark';
    progress.classList.add('p'+number%100);
}

function reset(){ 
    counter = 0; 
    setProgress(0);
    setCookie("counter", counter, 30);
    // numberDiv.textContent = counter;
}

function togglePannel(){
    var _bottom = -(panel.css('bottom').replace(/[^\d\.]/g, ''));
    if(_bottom < 0) _bottom = 0;
    else _bottom = '-120%';
    panel.css({bottom: _bottom});
}

function onShowPanel(){
    togglePannel();
    showStates();    
}

function onClosePanel(){
    togglePannel();
    $('#panel').find('.state').remove();   
}

function showStates(){
    states.forEach(el => {
        var state = $('.state-tpl').clone(true);
        state.removeClass('state-tpl d-none').addClass('state');
        state.find('.text').text(el);
        state.prependTo( $('#panel').find('.all-states') );
    });
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