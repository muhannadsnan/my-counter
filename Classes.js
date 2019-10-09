class Record {
    constructor(title, counter, total){
        this.title = title || "Untitled";
        this.counter = counter || 0;
        this.total = total || 0;
        this.print();
    }
    print(){
        console.log("Record instantiated!");
    }
}

class Store {
    constructor(records, selectedIndex){
        this.records = records || [new Record()];
        this.selectedIndex = selectedIndex || 0;
        this.print();
    }
    print(){
        console.log("Store instantiated!");
    }
}