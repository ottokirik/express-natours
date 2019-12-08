class APIFeatures {
  //BUILD QUERY
  ///api/v1/tours?duration[gte]=5&sort=-price,duration
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1a. Filtering
    // query string, http://..../tours?duration=5&difficulty=easy
    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    const queryObj = { ...this.queryString };
    const excludeFields = ['page', 'sort', 'limit', 'fields'];
    excludeFields.forEach(it => delete queryObj[it]);

    //1b. Advanced Filtering
    //get, gt, lte, lt
    //{ duration: { gte: 5 } } to { duration: { $gte: 5 } }
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    return this;
  }

  sort() {
    //2. Sorting
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    return this;
  }

  limitFields() {
    //3. Fields limiting
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); //Excluding service field
    }

    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    return this;
  }

  paginate() {
    //Pagination
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 5;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    // eslint-disable-next-line node/no-unsupported-features/es-syntax
    return this;
  }
}

module.exports = APIFeatures;
