class Record{
    constructor(id, title, counter, goal, total, isActive, counterDay, counterWeek){
        // this.id = uniqID();
        this.id = id || null;
        this.title = title || "Counter 01";
        this.counter = counter || 0;
        this.goal = goal || 100;
        this.total = total || 0;
        this.counterDay = counterDay || 0;
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

class Settings{
    constructor(delayRefresh){
        this.delayRefresh = delayRefresh || true;
        this.print();
    }
    print(){
        console.log("Settings initiated..", this);
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
    }

    fetchUser(username){
        return dbCollection.doc(username).get(); // get by id
    }

    // register(){
    //     var username = $authPanel.find('.register-panel .username').val().trim() || "";
    //     var email = $authPanel.find('.register-panel .email').val().trim() || "";
    //     var password = $authPanel.find('.register-panel .password').val().trim() || "";
    //     if(username.trim() && email.trim() && password.trim()){
    //         Database.prototype.fetchUser(username).then(function(docRef){
    //             if(!docRef.data()){
    //                 // REGISTER STORE
    //                 firebase.auth().createUserWithEmailAndPassword(email, password).then(function(){
    //                     alert("Welcome "+username+" to M-Digital Counter!");
    //                     // LOGIN THE NEW STORE
    //                     userID = username; // must be separated from STORE bcz we dont need to save it to db
    //                     STORE = {email: email};
    //                     bootApp();
    //                     $authPanel.removeClass('show');
    //                 }).catch(function(error) {
    //                     alert(error.message); console.log(error.code); 
    //                 });
    //             }else{
    //                 alert("Username already exists. Choose a different one.");
    //             }
    //         })
    //         .catch(function(error){
    //             console.error(error);
    //             alert("Failed to load user! "+error);
    //             return false;
    //         });
    //     }
    //     else{
    //         alert("Registeration failed! Please provide all fields.");
    //     }
    // }

    // login(){
    //     var username = $authPanel.find('.username').val().trim() || false;
    //     if(username){
    //         var password = $authPanel.find('.login-panel .password').val().trim() || false;
    //         if(!password){ // BEFORE ENTERING PASSWORD
    //             $authPanel.find('#loginBtn').prop('disabled', true).find('span.1, i').toggleClass('d-none');
    //             if(!Object.keys(STORE).length){ // FETCH STORE IF HAVEN'T
    //                 Database.prototype.fetchUser(username).then(function(docRef){
    //                     STORE = docRef.data() || false;
    //                     if(!STORE){ 
    //                         alert("This user is not registered.");
    //                         $authPanel.find('#loginBtn').prop('disabled', false).find('span.1, i').toggleClass('d-none');
    //                     }else{
    //                         userID = username;
    //                         $authPanel.find('.login-panel .swipe-container').addClass('show-2').find('.password').focus();
    //                         $authPanel.find('#loginBtn').prop('disabled', true).find('span.3, i').toggleClass('d-none');
    //                     }
    //                     console.log("userID", userID, "username", username); 
    //                 })
    //                 .catch(function(error){
    //                     console.error(error);
    //                     alert("Failed to load user!");
    //                     $authPanel.find('#loginBtn').find('span.1, i').toggleClass('d-none');
    //                 });
    //             }else{ // STORE FOUND
    //                 $authPanel.find('.login-panel .swipe-container').addClass('show-2').find('.password').focus();
    //                 $authPanel.find('#loginBtn').prop('disabled', true).find('span.3, i').toggleClass('d-none');
    //             }
    //         }else{ // STORE HAS ENTERED PASSWORD
    //             if(/* is_password_correct */true){
    //                 bootApp();
    //                 $authPanel.removeClass('show');
    //                 togglePannel();
    //             }else{
    //                 //
    //             }
    //         }
    //     }
    //     else{
    //         alert("Login failed! username cannot be empty.");
    //     }
    // }

    do_signin(provider){
        // IMPORTANT: when running from localhost, use a web server to load the html page, so that google signin works:
        // > python3 -m http.server 1234  // then go to http://localhost:1234/
        firebase.auth().signInWithPopup(provider)
            .then(function(result) {
                TOKEN = result.credential.accessToken;
                USER = result.user;
                console.log(isLoggedIn() ? "You are signed in!!" : "still stated as not signed in.."); 
                Cookies.set("token", TOKEN, cookieOptions);
                Cookies.set("user", JSON.stringify(USER), cookieOptions);
                STORE = Cookies.get() || false;
                if(STORE){ // when there is cookie-store, fetch user so that it does not be saved
                    Database.prototype.x_signin();
                }
           });
    }

    x_signin(){
        Database.prototype.fetchUserData().then(function(result){
            console.log("here is then", ); 
            if(result == "NO SUCH EMAIL EXISTS BEFORE"){ // SAVE cookie-store, WARNING: overwrite database in cloud
                console.log(1,STORE)
                // json-parse the cookie-store before it is saved to cloud
                if(STORE['history'] !== undefined && typeof STORE['history'] == 'string') 
                    STORE['history'] = JSON.parse(STORE['history']);
                if(STORE['records'] !== undefined && typeof STORE['records'] == 'string') 
                    STORE['records'] = JSON.parse(STORE['records']);
                if(STORE['settings'] !== undefined && typeof STORE['settings'] == 'string') 
                    STORE['settings'] = JSON.parse(STORE['settings']);
                if(STORE['user'] !== undefined && typeof STORE['user'] == 'string') 
                    STORE['user'] = JSON.parse(STORE['user']);
                USER = STORE['user'];
                console.log(2,STORE)
                save(); // !! cookies-store upload !!
                console.log(3,STORE)
                bootApp();
            }else{
                bootApp();
                showRecords();
            }
        })
        .catch(function(error){
            alert("Failed to signin! "+error);
            console.log("here is catch", error); 
        })
    }

    fetchUserData(){
        return new Promise(function(resolve, reject) {
            Database.prototype.fetchUser(USER.email).then(function(docRef){
                if(docRef.data() === undefined){ // SAVE cookie-store
                    resolve("NO SUCH EMAIL EXISTS BEFORE");
                }else{
                    STORE = docRef.data() || false;
                    if(STORE){
                        resolve(true); // when successful
                    }else{
                        reject("No data found. Try another account.");
                    }
                }
            })
            .catch(function(error){
                reject(error);
            });
        });
    }
    
    signOut(){
        firebase.auth().signOut();
    }
    
    save(){
        if(STORE.records === undefined || STORE.records.length == 0){
            alert("Cannot save empty STORE!");
            return;
        }
        // dbCollection.doc(USER.email).set(JSON.parse(JSON.stringify(STORE)))
        dbCollection.doc(USER.email).set(STORE)
            .then(function() {
                // console.log("DB saved.");
            })
            .catch(function(error) {
                console.error("Error saving DB: ", error);
            });
    }

    BACKUP_USER(){
        var lastWriting = STORE.history.lastWriting;
        var _db = firebase.firestore();
        _db.collection("_BACKUP-counter-users").doc(USER.email).get().then(function(docRef){ 
            lastWriting = new Date(Date.parse(lastWriting));
            var lastBackup = false;
            if(docRef.data() !== undefined){
                lastBackup = new Date(docRef.data().history.lastWriting) || false;
            }
            if(!lastBackup /*first-time backup*/ || (lastWriting.getDate() != lastBackup.getDate() || lastWriting.getMonth() != lastBackup.getMonth() || lastWriting.getFullYear() != lastBackup.getFullYear()) ){
                _db.collection("_BACKUP-counter-users").doc(USER.email).set(JSON.parse(JSON.stringify(STORE)))
                    .then(function() {
                        console.log("User auto backup was taken!");
                    })
                    .catch(function(error) {
                        console.error("Couldn't take auto backup! (#5502) ", error);
                        alert("Couldn't take auto backup! (#5502) " + error);
                    });
            }
        })
        .catch(function(error) {
            console.error("Error backing up User: (#5503) ", error);
            alert("Couldn't take auto backup! (#5503) " + error);
        });
    }
}

function uniqID(){
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

Date.prototype.getWeekNumber = function(){
    var d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
    var dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  };
/* 
GRAPHS:
    - show chart for a certain record
    - can add another record to the chart for comparison
    https://www.chartjs.org/samples/latest/

    - Each Record has History
    - A History is an array of Logs
    - On startup, we check if the last writing is today OR >=today-7 OR month is Date.month OR year is Date.year.
 */