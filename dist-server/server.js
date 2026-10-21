// server.ts
import express from "express";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// shared/pricing.ts
var FOUNDING_ENDS_AT = "2026-10-28T23:59:00+08:00";
function calculatePrice(pack, nowMs = Date.now()) {
  const targetTime = new Date(FOUNDING_ENDS_AT).getTime();
  const isFounding = nowMs < targetTime;
  if (isFounding) {
    if (pack === "200") {
      return {
        amountCents: 4990,
        formatted: "RM49.90",
        isFounding: true,
        packDescription: "200 illustrated science sheets (PDF)"
      };
    }
    return {
      amountCents: 3990,
      formatted: "RM39.90",
      isFounding: true,
      packDescription: "100 illustrated science sheets (PDF)"
    };
  } else {
    if (pack === "200") {
      return {
        amountCents: 7990,
        formatted: "RM79.90",
        isFounding: false,
        packDescription: "200 illustrated science sheets (PDF)"
      };
    }
    return {
      amountCents: 5990,
      formatted: "RM59.90",
      isFounding: false,
      packDescription: "100 illustrated science sheets (PDF)"
    };
  }
}

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
function loadFirebaseConfig() {
  try {
    const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.projectId) {
        return {
          projectId: parsed.projectId,
          apiKey: parsed.apiKey || "",
          firestoreDatabaseId: parsed.firestoreDatabaseId || "(default)"
        };
      }
    }
  } catch (err) {
    console.error("[Firebase Admin] Error loading firebase-applet-config.json:", err);
  }
  return {
    projectId: process.env.GCLOUD_PROJECT || "science-made-visual",
    apiKey: "",
    firestoreDatabaseId: "(default)"
  };
}
var fbConfig = loadFirebaseConfig();
if (!getApps().length) {
  try {
    initializeApp({
      projectId: fbConfig.projectId
    });
    console.log(`[Firebase Admin] Initialized for project: ${fbConfig.projectId}`);
  } catch (initErr) {
    console.error("[Firebase Admin] Failed to initialize admin app:", initErr);
  }
}
var firestoreDb = getFirestore(getApp(), fbConfig.firestoreDatabaseId);
async function createFirestoreOrder(order) {
  const docRef = firestoreDb.collection("orders").doc(order.orderId);
  await docRef.set({
    ...order,
    billCode: order.billCode || null,
    refno: order.refno || null,
    paidAt: order.paidAt || null
  });
  console.log(`[Firestore] Order ${order.orderId} created successfully.`);
}
async function getFirestoreOrder(orderId) {
  try {
    const docRef = firestoreDb.collection("orders").doc(orderId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return snap.data();
  } catch (err) {
    console.warn(`[Firestore] Could not load order ${orderId}:`, err.message);
    return null;
  }
}
async function updateOrderBillCode(orderId, billCode) {
  const docRef = firestoreDb.collection("orders").doc(orderId);
  await docRef.update({ billCode });
  console.log(`[Firestore] Order ${orderId} updated with billCode: ${billCode}`);
}
async function markOrderAsPaid(orderId, refno) {
  const docRef = firestoreDb.collection("orders").doc(orderId);
  await docRef.update({
    status: "paid",
    refno,
    paidAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  console.log(`[Firestore] Order ${orderId} marked as PAID.`);
}
async function markOrderAsFailed(orderId) {
  const docRef = firestoreDb.collection("orders").doc(orderId);
  await docRef.update({ status: "failed" });
  console.log(`[Firestore] Order ${orderId} marked as FAILED.`);
}
function getToyyibpayBaseUrl() {
  const url = process.env.TOYYIBPAY_BASE_URL?.trim();
  if (url) return url.replace(/\/+$/, "");
  return "https://dev.toyyibpay.com";
}
function getPaymentChannel() {
  return process.env.TOYYIBPAY_PAYMENT_CHANNEL?.trim() || "0";
}
function getDownloadLink(pack) {
  const link = pack === "200" ? process.env.DOWNLOAD_LINK_200?.trim() : process.env.DOWNLOAD_LINK_100?.trim();
  if (!link) {
    console.error(`[Download Link Missing] DOWNLOAD_LINK_${pack} is not configured in environment.`);
    return null;
  }
  return link;
}
async function createToyyibpayBill(params) {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
  const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE?.trim();
  const baseUrl = getToyyibpayBaseUrl();
  const paymentChannel = getPaymentChannel();
  if (!secretKey || !categoryCode) {
    console.error("[toyyibPay] toyyibPay secrets missing: TOYYIBPAY_SECRET_KEY or TOYYIBPAY_CATEGORY_CODE");
    throw new Error("toyyibPay secrets missing");
  }
  const billDescription = params.pack === "200" ? "200 illustrated science sheets (PDF)" : "100 illustrated science sheets (PDF)";
  const formParams = new URLSearchParams({
    userSecretKey: secretKey,
    categoryCode,
    billName: "Science Made Visual",
    billDescription: billDescription.substring(0, 100),
    billPriceSetting: "1",
    billPayorInfo: "1",
    billAmount: params.amountCents.toString(),
    billReturnUrl: `${params.siteUrl}/thank-you`,
    billCallbackUrl: `${params.siteUrl}/api/toyyibpay/callback`,
    billExternalReferenceNo: params.orderId,
    billTo: params.name,
    billEmail: params.email,
    billPhone: params.phone,
    billPaymentChannel: paymentChannel,
    billChargeToCustomer: "",
    billExpiryDays: "1",
    billContentEmail: `Thank you for your purchase! Download your science sheets here: ${params.downloadLink}. Please save this link.`
  });
  const endpoint = `${baseUrl}/index.php/api/createBill`;
  console.log(`[toyyibPay] Calling createBill at: ${endpoint} for order: ${params.orderId}`);
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formParams.toString()
  });
  if (!res.ok) {
    const errorBody = await res.text();
    console.error(`[toyyibPay] createBill HTTP error ${res.status}:`, errorBody);
    throw new Error(`toyyibPay HTTP error ${res.status}`);
  }
  const responseText = await res.text();
  console.log("[toyyibPay] createBill response:", responseText);
  let billCode = "";
  try {
    const parsed = JSON.parse(responseText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      billCode = parsed[0].BillCode || parsed[0].billCode || "";
    } else if (parsed && typeof parsed === "object") {
      billCode = parsed.BillCode || parsed.billCode || "";
    }
  } catch (parseErr) {
    console.error("[toyyibPay] JSON parse error for createBill:", parseErr);
  }
  if (!billCode) {
    throw new Error(`Could not obtain BillCode from toyyibPay: ${responseText}`);
  }
  return {
    billCode,
    paymentUrl: `${baseUrl}/${billCode}`
  };
}
function verifyCallbackHash(params) {
  const expectedData = `${params.secretKey}${params.status}${params.orderId}${params.refno}ok`;
  const calculatedHash = crypto.createHash("md5").update(expectedData).digest("hex");
  return calculatedHash.toLowerCase() === params.hash.toLowerCase();
}
async function verifyBillTransaction(billCode, expectedAmountCents) {
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
  const baseUrl = getToyyibpayBaseUrl();
  if (!secretKey) {
    console.error("[toyyibPay] verifyBillTransaction: Missing TOYYIBPAY_SECRET_KEY");
    return { paid: false };
  }
  try {
    const formParams = new URLSearchParams({
      billCode,
      userSecretKey: secretKey
    });
    const endpoint = `${baseUrl}/index.php/api/getBillTransactions`;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formParams.toString()
    });
    if (!res.ok) {
      console.warn(`[toyyibPay] getBillTransactions error status: ${res.status}`);
      return { paid: false };
    }
    const data = await res.json();
    console.log(`[toyyibPay] getBillTransactions for bill ${billCode}:`, data);
    if (Array.isArray(data) && data.length > 0) {
      for (const tx of data) {
        const isSuccess = tx.billpaymentStatus === "1" || tx.billpaymentStatus === 1;
        const txAmountCents = Math.round(parseFloat(tx.billpaymentAmount || "0") * 100);
        if (isSuccess && txAmountCents === expectedAmountCents) {
          const refno = tx.billpaymentInvoiceNo || tx.billPaymentInvoiceNo || tx.billpaymentSettlementNo || tx.billExternalReferenceNo || "";
          return { paid: true, refno };
        }
      }
    }
  } catch (err) {
    console.error("[toyyibPay] Exception in verifyBillTransaction:", err);
  }
  return { paid: false };
}
var app = express();
var PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.set("trust proxy", 1);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
function getSiteUrl(req) {
  if (process.env.SITE_URL?.trim()) {
    return process.env.SITE_URL.trim().replace(/\/+$/, "");
  }
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  return `${proto}://${host}`;
}
var checkoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 30,
  message: { error: "Too many checkout requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});
function maskEmail(email) {
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return `${name[0]}*@${domain}`;
  }
  return `${name[0]}${"*".repeat(name.length - 2)}${name[name.length - 1]}@${domain}`;
}
app.get("/api/payment-methods", (_req, res) => {
  const channel = getPaymentChannel();
  res.json({
    channel,
    allowsCards: channel === "2",
    label: channel === "2" ? "FPX online banking & cards" : "FPX online banking"
  });
});
app.post("/api/checkout", checkoutLimiter, async (req, res) => {
  try {
    const { pack, name, email, phone } = req.body;
    const selectedPack = pack === "200" ? "200" : "100";
    const cleanName = typeof name === "string" ? name.trim() : "";
    const cleanEmail = typeof email === "string" ? email.trim() : "";
    const cleanPhone = typeof phone === "string" ? phone.trim().replace(/[\s\-()]/g, "") : "";
    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: "Please enter your full name." });
      return;
    }
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }
    if (!cleanPhone || cleanPhone.length < 8) {
      res.status(400).json({ error: "Please enter a valid Malaysian phone number." });
      return;
    }
    const downloadLink = getDownloadLink(selectedPack);
    if (!downloadLink) {
      console.error(`[Checkout Blocked] Download link not set for pack ${selectedPack}.`);
      res.status(500).json({ error: "Download link is not configured for this pack. Please contact support." });
      return;
    }
    const pricing = calculatePrice(selectedPack);
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `SMV-${Date.now()}-${randomSuffix}`;
    const siteUrl = getSiteUrl(req);
    const newOrder = {
      orderId,
      pack: selectedPack,
      amount: pricing.amountCents,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      status: "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      await createFirestoreOrder(newOrder);
    } catch (dbErr) {
      console.error("[Firestore Write Failed]", dbErr);
      res.status(500).json({ error: "We couldn't save your order. Please try again." });
      return;
    }
    const bill = await createToyyibpayBill({
      orderId,
      pack: selectedPack,
      amountCents: pricing.amountCents,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      siteUrl,
      downloadLink
    });
    await updateOrderBillCode(orderId, bill.billCode);
    console.log(`[Order Initiated] Order ${orderId} linked to bill ${bill.billCode}`);
    res.json({ url: bill.paymentUrl, orderId, billCode: bill.billCode });
  } catch (err) {
    console.error("[Checkout Error]", err);
    res.status(500).json({ error: "We couldn't start the payment. Please try again." });
  }
});
app.post("/api/toyyibpay/callback", async (req, res) => {
  console.log("[toyyibPay Callback] Received notification payload:", req.body);
  const { refno, status, billcode, order_id, hash } = req.body;
  const orderId = (order_id || "").toString();
  const callbackBillCode = (billcode || "").toString();
  const txStatus = (status || "").toString();
  const txRefno = (refno || "").toString();
  const receivedHash = (hash || "").toString();
  const secretKey = process.env.TOYYIBPAY_SECRET_KEY?.trim();
  if (!secretKey || !receivedHash) {
    console.error("[toyyibPay Callback Ignored] Missing secret key or hash.");
    res.status(200).send("OK");
    return;
  }
  const hashMatches = verifyCallbackHash({
    secretKey,
    status: txStatus,
    orderId,
    refno: txRefno,
    hash: receivedHash
  });
  if (!hashMatches) {
    console.error(`[toyyibPay Callback Ignored] Hash mismatch for order ${orderId}.`);
    res.status(200).send("OK");
    return;
  }
  const order = await getFirestoreOrder(orderId);
  if (!order) {
    console.warn(`[toyyibPay Callback Ignored] Order ${orderId} not found in Firestore.`);
    res.status(200).send("OK");
    return;
  }
  if (!order.billCode || order.billCode !== callbackBillCode) {
    console.error(`[toyyibPay Callback Ignored] BillCode mismatch for order ${orderId}. Expected ${order.billCode}, got ${callbackBillCode}`);
    res.status(200).send("OK");
    return;
  }
  if (order.status === "paid") {
    console.log(`[toyyibPay Callback] Order ${orderId} is already marked as paid.`);
    res.status(200).send("OK");
    return;
  }
  const verification = await verifyBillTransaction(order.billCode, order.amount);
  if (verification.paid) {
    await markOrderAsPaid(orderId, txRefno || verification.refno || "PAID_TX");
    console.log(`[toyyibPay Callback] Order ${orderId} verified and marked as PAID.`);
  } else if (txStatus === "3") {
    await markOrderAsFailed(orderId);
    console.log(`[toyyibPay Callback] Order ${orderId} marked as FAILED.`);
  } else {
    console.log(`[toyyibPay Callback] Order ${orderId} transaction could not be verified yet. Status remains pending.`);
  }
  res.status(200).send("OK");
});
app.get("/api/order-status", async (req, res) => {
  try {
    const orderId = (req.query.order_id || req.query.orderId || "").toString();
    const billCodeFromQuery = (req.query.billcode || req.query.billCode || "").toString();
    if (!orderId) {
      res.status(400).json({ error: "Missing order_id" });
      return;
    }
    const order = await getFirestoreOrder(orderId);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (billCodeFromQuery && order.billCode && order.billCode !== billCodeFromQuery) {
      console.warn(`[Order Status Forbidden] Query billcode ${billCodeFromQuery} !== saved ${order.billCode}`);
      res.status(403).json({ error: "Invalid verification for this order" });
      return;
    }
    if (order.status === "pending" && order.billCode) {
      const verification = await verifyBillTransaction(order.billCode, order.amount);
      if (verification.paid) {
        await markOrderAsPaid(orderId, verification.refno || "PAID_TX");
        order.status = "paid";
      }
    }
    if (order.status === "paid") {
      const downloadUrl = getDownloadLink(order.pack);
      res.json({
        status: "paid",
        orderId: order.orderId,
        pack: order.pack,
        downloadUrl,
        email: maskEmail(order.email)
      });
      return;
    }
    if (order.status === "failed") {
      res.json({ status: "failed", orderId: order.orderId });
      return;
    }
    res.json({ status: "pending", orderId: order.orderId });
  } catch (err) {
    console.error("[Order Status Error]", err);
    res.status(500).json({ error: "Could not fetch order status" });
  }
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "..", "dist");
    const fallbackDist = path.resolve(__dirname, "dist");
    const activeDist = fs.existsSync(distPath) ? distPath : fallbackDist;
    app.use(express.static(activeDist));
    app.use((_req, res) => {
      res.sendFile(path.resolve(activeDist, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Listening on http://0.0.0.0:${PORT} (Production: ${isProd})`);
  });
}
startServer();
export {
  createToyyibpayBill,
  getDownloadLink,
  getPaymentChannel,
  getToyyibpayBaseUrl,
  verifyBillTransaction,
  verifyCallbackHash
};
