import { Router } from 'express';
import { register, login, refresh } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { WorkerProfile } from '../models/WorkerProfile.js';
import { Job } from '../models/Job.js';
import { Application, Document, IncomeRecord } from '../models/Record.js';
import { askGemini } from '../services/aiService.js';

export const api = Router();
api.post('/auth/register', register);
api.post('/auth/login', login);
api.post('/auth/refresh', refresh);

api.get('/workers/me', authenticate, async (req,res,next) => { try { res.json(await WorkerProfile.findOne({ user:req.user.sub }).populate('user','name email')); } catch(e){next(e);} });
api.patch('/workers/me', authenticate, authorize('worker'), async (req,res,next) => { try { res.json(await WorkerProfile.findOneAndUpdate({user:req.user.sub}, req.body, {new:true,upsert:true,runValidators:true})); } catch(e){next(e);} });
api.get('/workers/:publicId/public', async (req,res,next) => { try { const worker=await WorkerProfile.findOne({publicId:req.params.publicId}).select('-bank -upiId').populate('user','name'); if(!worker)return res.status(404).json({message:'Passport not found'});res.json(worker); }catch(e){next(e);} });

api.get('/jobs', async (req,res,next) => { try { const filter={status:'open'};if(req.query.city)filter['location.city']=req.query.city;res.json(await Job.find(filter).sort('-createdAt').limit(50)); }catch(e){next(e);} });
api.post('/jobs', authenticate, authorize('employer','admin'), async (req,res,next)=>{try{res.status(201).json(await Job.create({...req.body,employer:req.user.sub}));}catch(e){next(e);}});
api.post('/applications', authenticate, authorize('worker'), async(req,res,next)=>{try{res.status(201).json(await Application.create({...req.body,worker:req.user.sub}));}catch(e){next(e);}});
api.get('/applications/me', authenticate, async(req,res,next)=>{try{res.json(await Application.find({worker:req.user.sub}).populate('job'));}catch(e){next(e);}});
api.get('/documents', authenticate, async(req,res,next)=>{try{res.json(await Document.find({worker:req.user.sub}).sort('-createdAt'));}catch(e){next(e);}});
api.get('/income', authenticate, async(req,res,next)=>{try{res.json(await IncomeRecord.find({worker:req.user.sub}).sort('transactionDate'));}catch(e){next(e);}});
api.post('/ai/:task', authenticate, async(req,res,next)=>{try{const profile=await WorkerProfile.findOne({user:req.user.sub}).lean();res.json(await askGemini(req.params.task,profile));}catch(e){next(e);}});
api.get('/schemes', (_req,res)=>res.json([
  {name:'PM Vishwakarma',officialUrl:'https://pmvishwakarma.gov.in/',benefits:'Toolkit support, training and concessional credit'},
  {name:'PMSBY',officialUrl:'https://jansuraksha.gov.in/',benefits:'Accident insurance cover'},
]));
api.get('/dashboard', authenticate, (_req,res)=>res.json({ profileCompletion:86, verifiedDocuments:7, newJobMatches:6, unreadNotifications:3 }));
