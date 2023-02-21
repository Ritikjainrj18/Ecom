const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

//Create new Order
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;

  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });

  res.status(201).json({
    success: true,
    order,
  });
});

// Get Single Order 
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  // populate will use user id and expand name and email
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if(!order){
    return next(new ErrorHandler("Order not found with this Id",404));
  }
  res.status(200).json({
    success:true,
    order
  })
});

// Get logged in User Order
exports.myOrder = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({user:req.user._id});

  res.status(200).json({
    success:true,
    orders
  })
});

// get all orders --Admin
exports.getAllOrder = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();
  
  let totalAmount=0;
  orders.forEach((order)=>{
    totalAmount+=order.totalPrice
  })
  res.status(200).json({
    success:true,
    orders
  })
});

// Update Order Status --admin

exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  
  if(!order){
    return next(new ErrorHandler("Order not found with this Id",404));
  }

  if(order.orderStatus==="Delivered"){
    return next(new ErrorHandler("Already Delivered this order",404));
  }

  order.orderItems.forEach(async (o)=>{
    await updateStock(o.product,o.quantity);
  });
  order.orderStatus=req.body.status;
  if(req.body.status==="Delivered"){
    order.deliveredAt=Date.now();
  }
  await order.save({validateBeforeSave:false});
  res.status(200).json({
    success:true,
    order
  })
});

async function updateStock(id,quantity){
    const product=await Product.findById(id);
  product.Stock-=quantity;
  console.log(product)
  product.save({validateBeforeSave:false});
}
// delete Order --Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.findById(req.params.id);
  
  if(!orders){
    return next(new ErrorHandler("Order not found with this Id",404));
  }

  await orders.remove()

  res.status(200).json({
    success:true,
    orders
  })
});