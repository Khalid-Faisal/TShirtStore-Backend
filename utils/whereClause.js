class WhereClause{
    constructor(base, bigQ){
        this.base = base;
        this.bigQ = bigQ;
    }

    search(){
        const searchword = this.bigQ.search ? {
            name: {
                $regex: this.bigQ.search,
                $option: 'i'
            }
        } : {}
        this.base = this.base.find({...searchword});

        return this;
    }

    filter(){
        const copyQ = {...this.bigQ};
        delete copyQ["search"];
        delete copyQ["limit"];
        delete copyQ["page"];

        //convert bigQ into string
        let stringOfcopyQ = JSON.stringify(copyQ);
        stringOfcopyQ = stringOfcopyQ.replace(/\b(gte|lte|lt|gt)\b/g, m=> `$${m}`);
        const jsonOfcopyQ = JSON.parse(stringOfcopyQ);
        this.base = this.base.find(jsonOfcopyQ);

        return this;
    }

    pager(resultPerPage){
        let currentPage = 1;
        if(this.bigQ.page){
            currentPage = this.bigQ.page;
        }
        const skipVal = resultPerPage * (currentPage-1);
        this.base = this.base.limit(resultPerPage).skip(skipVal);
    }
}

module.exports = WhereClause;