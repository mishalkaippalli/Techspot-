const express = require('express')
const app = express()
const fetch = require("node-fetch");
require("dotenv/config");
const path = require("path");
const Order = require("../models/orderSchema")

const paypal = require('@paypal/checkout-server-sdk')
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET} = process.env;
const base = "https://api-m.sandbox.paypal.com";


app.set('view engine', "ejs")
app.use(express.static("public"))
app.use(express.json())

const products = new Map([
    [1, {price: 100, name: "s24 ultra"}],
    [2, {price: 200, name: "iphone 15 plus"}],
])

const generateAccessToken = async () => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(
      PAYPAL_CLIENT_ID + ":" + PAYPAL_CLIENT_SECRET,
    ).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};

const createOrder = async (cart) => {
  // use the cart information passed from the front-end to calculate the purchase unit details
  console.log(
    "shopping cart information passed from the frontend createOrder() callback:",
    cart,
  );
  
  const total = 200
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
 
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "EUR",
          value: total,
        },
      },
    ],
  };
  
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
    //   "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
     },
    method: "POST",
    body: JSON.stringify(payload),
  });
  
  return handleResponse(response);
};

const captureOrder = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
      // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
      // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
      // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
    },
  });
  
  return handleResponse(response);
};

async function handleResponse(response) {
  try {
    const jsonResponse = await response.json();
    return {
      jsonResponse,
      httpStatusCode: response.status,
    };
  } catch (err) {
    const errorMessage = await response.text();
    throw new Error(errorMessage);
  }
}
const paypalpage = async (req, res) => {
    try {
        const orderId = req.query.orderId
        console.log("inside paypalpage in paypalcontroller order id form query is ",orderId)
        const findOrder = await Order.findOne({_id: orderId})
        console.log("indidepaypal page ", findOrder);
        const cartproductsnameandquantity = findOrder.product.map(product => ({
          name: product.name,
          quantity: product.quantity
        }));
        const totalcost = findOrder.totalPrice;
        console.log("totalcost", totalcost);
        console.log("cartproductsnameandquantity", cartproductsnameandquantity)
        res.render("index", {paypalClientId: PAYPAL_CLIENT_ID} ) 
    } catch (error) {
        console.log(error.message)
    }
}

const paypalOrderCreator = async(req, res) => {
    try {
        // use the cart information passed from the front-end to calculate the order amount details
        const { cart } = req.body;
        // const {totalcost} = req.body;
        console.log("inside app.post /api.orders, cart is ", cart)
        const { jsonResponse, httpStatusCode } = await createOrder(cart);
        res.status(httpStatusCode).json(jsonResponse);
      } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
      }
}

const paypalCaptureOrder = async(req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
      } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
      }
}

module.exports = { 
                   paypalpage,
                   paypalOrderCreator,
                   paypalCaptureOrder
                 }