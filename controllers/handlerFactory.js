const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.readOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    const {
      params: { id }
    } = req;

    let query = Model.findById(id);

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError(`No document found with that ID: ${id}`, 404));
    }

    res.status(201).json({
      status: 'saccess',
      data: {
        data: doc
      }
    });
  });

exports.readAll = Model =>
  catchAsync(async (req, res, next) => {
    //EXECUTE QUERY выполняется, только с await
    const features = new APIFeatures(Model.find(req.filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    //const docs = awat features.query.explain(); Статистика по запросу
    const docs = await features.query;

    res.status(201).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError(`No document found with that ID: ${id}`, 404));
    }

    res.status(201).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const doc = await Model.findByIdAndDelete(id);

    if (!doc) {
      return next(new AppError(`No document found with that ID: ${id}`, 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  });
