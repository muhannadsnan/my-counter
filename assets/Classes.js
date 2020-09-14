class Record{
    constructor(id, title, counter, goal, total, isActive, counterLog){
        // this.id = uniqID();
        this.id = id || null;
        this.title = title || "Untitled";
        this.counter = counter || 0;
        this.goal = goal || 100;
        this.total = total || 0;
        this.counterLog = counterLog || 0;
        this.counterWeek = counterWeek || 0;
        this.print();
    }
    print(){
        console.log("Record instantiated!");
    }
}

class History{
    constructor(logBooks, lastWriting){
        this.logBooks = logBooks || [];
        this.lastWriting = lastWriting || 0;
        this.print();
    }
    print(){
        console.log("History instantiated!");
    }
}

class Log{
    constructor(date, value){
        this.date = date || null;
        this.value = value || 0;
        this.print();
    }
    print(){
        console.log("Log instantiated!");
    }
}

class Logbook{
    constructor(recordId, logs, weekly, monthly, yearly){
        this.recordId = recordId || 0;
        this.logs = [];
        if(logs !== undefined && logs !== null) 
            this.logs.push(logs);
        this.print();
    }
    print(){
        console.log("Logbook instantiated! id: "+this.recordId);
    }
}

class Database{
    constructor(){
        this.init();
    }

    init(){
        firebase.initializeApp({
            apiKey: 'AIzaSyBP196irDbj3NgzWnTggEV_5XQJlNhRL5k',
            authDomain: 'test-firebase-597da.firebaseapp.com',
            projectId: 'test-firebase-597da'
        });
        firebase_db = firebase.firestore();
        dbCollection = firebase_db.collection("counter-users");
        console.log("DB connection established.");
        USER = {};
    }
    
    validate_auth(e){
        if(e.type == "keypress" && (e.keyCode == 13)){
            $('#auth-panel .auth.active button.do-auth').trigger("click");
        }
        $authPanel.find('#login').prop('disabled', $(this).val().trim() == false);
        $authPanel.find('#register').prop('disabled', $(this).val().trim() == false);
    }

    fetchUser(username){
        // return dbCollection.where("I", "==", username).get();
        return dbCollection.doc(username).get(); // get by id
    }

    register(){
        var username = $authPanel.find('.register-panel .username').val().trim() || "";
        var email = $authPanel.find('.register-panel .email').val().trim() || "";
        var password = $authPanel.find('.register-panel .password').val().trim() || "";
        if(username.trim() && email.trim() && password.trim()){
            Database.prototype.fetchUser(username).then(function(docRef){
                if(!docRef.data()){
                    // REGISTER USER
                    firebase.auth().createUserWithEmailAndPassword(email, password).then(function(){
                        alert("Welcome "+username+" to M-Digital Counter!");
                        // LOGIN THE NEW USER
                        userID = username; // must be separated from USER bcz we dont need to save it to db
                        USER = {email: email};
                        bootApp();
                        $authPanel.removeClass('show');
                    }).catch(function(error) {
                        alert(error.message); console.log(error.code); 
                    });
                }else{
                    alert("Username already exists. Choose a different one.");
                }
            })
            .catch(function(error){
                console.error(error);
                alert("Failed to load user! "+error);
                return false;
            });
        }
        else{
            alert("Registeration failed! Please provide all fields.");
        }
    }

    login(){
        var username = $authPanel.find('.username').val().trim() || false;
        if(username){
            var password = $authPanel.find('.login-panel .password').val().trim() || false;
            if(!password){ // BEFORE ENTERING PASSWORD
                $authPanel.find('#login').prop('disabled', true).find('span.1, i').toggleClass('d-none');
                if(!Object.keys(USER).length){ // FETCH USER IF HAVE'NT
                    Database.prototype.fetchUser(username).then(function(docRef){
                        USER = docRef.data() || false;
                        if(!USER){ 
                            alert("This user is not registered.");
                            $authPanel.find('#login').prop('disabled', false).find('span.1, i').toggleClass('d-none');
                        }else{
                            userID = username;
                            $authPanel.find('.login-panel .swipe-container').addClass('show-2').find('.password').focus();
                            $authPanel.find('#login').prop('disabled', true).find('span.3, i').toggleClass('d-none');
                        }
                    })
                    .catch(function(error){
                        console.error(error);
                        alert("Failed to load user!");
                        $authPanel.find('#login').find('span.1, i').toggleClass('d-none');
                    });
                }else{ // USER FOUND
                    $authPanel.find('.login-panel .swipe-container').addClass('show-2').find('.password').focus();
                    $authPanel.find('#login').prop('disabled', true).find('span.3, i').toggleClass('d-none');
                }
            }else{ // USER HAS ENTERED PASSWORD
                if(/* is_password_correct */true){
                    bootApp();
                    $authPanel.removeClass('show');
                }else{
                    //
                }
            }
        }
        else{
            alert("Login failed! username cannot be empty.");
        }
    }
    
    loginUserByCookies(){
        Database.prototype.fetchUser(userID).then(function(docRef){
            USER = docRef.data() || false;
            if(USER){
                bootApp();
            }else{
                alert("Cannot login user. Try again.");
            }
        })
        .catch(function(error){
            console.error(error);
            alert("Failed to login user! "+error);
            return false;
        });
    }
    
    save(){
        if(USER.records === undefined || USER.records.length == 0){
            alert("Cannot save empty USER!");
            return;
        }
        dbCollection.doc(userID).set(JSON.parse(JSON.stringify(USER)))
            .then(function() {
                // console.log("DB saved.");
            })
            .catch(function(error) {
                console.error("Error saving DB: ", error);
            });
    }

    BACKUP_USER(){
        var lastWriting = USER.history.lastWriting;
        var _db = firebase.firestore();
        // _db.collection("_BACKUP-counter-users").where("id", "==", USER.email).get().then(function(querySnapshot){
        _db.collection("_BACKUP-counter-users").doc(userID).get().then(function(docRef){ 
            lastWriting = new Date(Date.parse(lastWriting));
            var lastBackup = new Date(docRef.data().history.lastWriting) || false;
            console.log("lastBackup", lastBackup); 
            if(!lastBackup){
                alert("Couldn't take auto backup!");
                return;
            }
            if(lastWriting.getDate() != lastBackup.getDate() || lastWriting.getMonth() != lastBackup.getMonth() || lastWriting.getFullYear() != lastBackup.getFullYear()){
                // console.log("lastBackup", lastBackup); 
                _db.collection("_BACKUP-counter-users").doc(userID).set(JSON.parse(JSON.stringify(USER)))
                    .then(function() {
                        console.log("User auto backup was taken!", USER);
                    })
                    .catch(function(error) {
                        console.error("Backup unsuccessfull! ", error);
                        alert("Backup unsuccessfull! " + error);
                    });
            }
        })
        .catch(function(error) {
            console.error("Error backing up User: ", error);
            alert("Couldn't take auto backup! " + error);
        });
    }
}

function uniqID(){
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}
/* 
GRAPHS:
    - show chart for a certain record
    - can add another record to the chart for comparison
    https://www.chartjs.org/samples/latest/

    - Each Record has History
    - A History is an array of Logs
    - On startup, we check if the last writing is today OR >=today-7 OR month is Date.month OR year is Date.year.
 */