class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  // for finding something we could use Product.find(name:"samosa") but will give only exact same but this will give samosamosa also
  search() {
    const keyword = this.queryStr.keyword
      ? {
          name: {
            $regex: this.queryStr.keyword,
            $options: "i", // case insenstivie
          },
        }
      : {};
    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr }; // {...something} makes the copy do not reference it

    // for finding category
    // queryStr have multiple fields so they must be removed and only filter should be kept
    const removeFields = ["keyword", "page", "limit"];
    // deleting some fields from the copy
    removeFields.forEach((key) => delete queryCopy[key]);

    // for price and rating
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`); //mongodb finds as $gt

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }
  // pagination
  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resultPerPage * (currentPage - 1);
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

module.exports = ApiFeatures;
