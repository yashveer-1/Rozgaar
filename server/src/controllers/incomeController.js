import { IncomeRecord } from '../models/Record.js';
import { getIncomeMetrics } from '../services/metricsService.js';
import { notFound } from '../utils/httpError.js';

const owned = (id, worker) => IncomeRecord.findOne({ _id: id, worker });

export async function listIncome(req, res, next) {
  try { return res.json(await IncomeRecord.find({ worker: req.user.sub }).populate('employer', 'name').sort('-date')); } catch (error) { return next(error); }
}
export async function incomeSummary(req, res, next) {
  try { return res.json(await getIncomeMetrics(req.user.sub)); } catch (error) { return next(error); }
}
export async function createIncome(req, res, next) {
  try { return res.status(201).json(await IncomeRecord.create({ ...req.body, worker: req.user.sub, verified: false })); } catch (error) { return next(error); }
}
export async function updateIncome(req, res, next) {
  try {
    const record = await owned(req.params.id, req.user.sub);
    if (!record) throw notFound('Income record');
    Object.assign(record, { ...req.body, worker: record.worker, verified: record.verified });
    return res.json(await record.save());
  } catch (error) { return next(error); }
}
export async function deleteIncome(req, res, next) {
  try {
    const record = await owned(req.params.id, req.user.sub);
    if (!record) throw notFound('Income record');
    await record.deleteOne();
    return res.status(204).end();
  } catch (error) { return next(error); }
}
