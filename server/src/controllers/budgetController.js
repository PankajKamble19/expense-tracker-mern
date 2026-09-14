import mongoose from 'mongoose';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import { budgetSchema } from '../validators/accountValidators.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const currentMonthYear = () => { const date = new Date(); return { month: date.getMonth() + 1, year: date.getFullYear() }; };

const validateCategoryBudgets = async (userId, categoryBudgets = []) => {
  if (!categoryBudgets.length) return true;
  const ids = categoryBudgets.map((item) => item.category);
  if (ids.some((id) => !mongoose.Types.ObjectId.isValid(id))) return false;
  const valid = await Category.countDocuments({ _id: { $in: ids }, user: userId, type: 'Expense' });
  return valid === new Set(ids.map(String)).size;
};

export const getBudgets = async (req,res,next)=>{try{const budgets=await Budget.find({user:req.user._id}).populate('categoryBudgets.category','name type').sort({year:-1,month:-1});return sendSuccess(res,'Budgets fetched',budgets)}catch(e){next(e)}};

export const getCurrentBudget = async (req,res,next)=>{try{
  const {month,year}=currentMonthYear();
  const budget=await Budget.findOne({user:req.user._id,month,year}).populate('categoryBudgets.category','name type');
  const start=new Date(year,month-1,1); const end=new Date(year,month,0,23,59,59,999);
  const expenseAgg=await Transaction.aggregate([
    {$match:{user:req.user._id,type:'Expense',date:{$gte:start,$lte:end}}},
    {$group:{_id:'$category',total:{$sum:'$amount'}}}
  ]);
  const spent=expenseAgg.reduce((s,x)=>s+x.total,0);
  if(!budget)return sendSuccess(res,'No budget configured for this month',{budget:null,spent,remaining:0,percentage:0,categoryProgress:[]});
  const remaining=budget.overallLimit-spent; const percentage=budget.overallLimit?(spent/budget.overallLimit)*100:0;
  const byCategory=Object.fromEntries(expenseAgg.map(x=>[String(x._id),x.total]));
  const categoryProgress=budget.categoryBudgets.map(item=>{const id=String(item.category?._id||item.category);const categorySpent=byCategory[id]||0;return{category:item.category,limit:item.limit,spent:categorySpent,remaining:item.limit-categorySpent,percentage:item.limit?(categorySpent/item.limit)*100:0}});
  return sendSuccess(res,'Current budget fetched',{budget,spent,remaining,percentage,categoryProgress});
}catch(e){next(e)}};

export const createBudget = async (req,res,next)=>{try{const parsed=budgetSchema.safeParse(req.body);if(!parsed.success)return sendError(res,'Validation failed',400,parsed.error.flatten().fieldErrors);const{month,year,categoryBudgets,overallLimit}=parsed.data;if(await Budget.exists({user:req.user._id,month,year}))return sendError(res,'Budget already exists for this month and year',409);if(!await validateCategoryBudgets(req.user._id,categoryBudgets))return sendError(res,'One or more category budget IDs are invalid',400);const budget=await Budget.create({user:req.user._id,month,year,overallLimit,categoryBudgets});return sendSuccess(res,'Budget created',budget,201)}catch(e){next(e)}};

export const updateBudget = async (req,res,next)=>{try{const{id}=req.params;if(!mongoose.Types.ObjectId.isValid(id))return sendError(res,'Invalid budget ID',400);const parsed=budgetSchema.partial().safeParse(req.body);if(!parsed.success)return sendError(res,'Validation failed',400,parsed.error.flatten().fieldErrors);const budget=await Budget.findOne({_id:id,user:req.user._id});if(!budget)return sendError(res,'Budget not found',404);if(parsed.data.categoryBudgets&&!await validateCategoryBudgets(req.user._id,parsed.data.categoryBudgets))return sendError(res,'One or more category budget IDs are invalid',400);Object.assign(budget,parsed.data);await budget.save();return sendSuccess(res,'Budget updated',budget)}catch(e){next(e)}};
