class Record{
    constructor(id, title, counter, goal, total, isActive, counterLog){
        // this.id = uniqID();
        this.id = id || null;
        this.title = title || "Untitled";
        this.counter = counter || 0;
        this.goal = goal || 100;
        this.total = total || 0;
        this.counterLog = counterLog || 0;
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