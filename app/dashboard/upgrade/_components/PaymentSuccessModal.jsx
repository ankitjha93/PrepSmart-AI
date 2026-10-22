"use client";

import React from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Download, 
  Rocket, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * PaymentSuccessModal
 * Celebratory confirmation modal shown upon verified Razorpay payment.
 */
export default function PaymentSuccessModal({ isOpen, onClose, details }) {
  if (!isOpen || !details) return null;

  const { plan, orderData, response, verifyData } = details;
  const paymentId = response?.razorpay_payment_id || "pay_verified";
  const orderId = orderData?.orderId || "order_verified";
  const amountFormatted = orderData?.currency === "INR"
    ? `₹${(orderData?.amount / 100).toLocaleString("en-IN")}`
    : `$${(orderData?.amount / 100).toFixed(2)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg p-6 md:p-8 bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-2xl space-y-6 overflow-hidden">
        
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-emerald-500/20 via-blue-500/10 to-transparent pointer-events-none rounded-full blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success Icon & Header */}
        <div className="text-center space-y-2 pt-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Payment Verified via Razorpay</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            You're Now a {plan?.name || "Pro Candidate"}!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Your payment was successfully processed. All premium FAANG interview rubrics, Ollama Llama 3.3 models, and unlimited sessions are unlocked.
          </p>
        </div>

        {/* Receipt Telemetry Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 text-xs">
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Transaction / Payment ID</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-200">{paymentId}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Razorpay Order ID</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">{orderId}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
            <span>Amount Paid</span>
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{amountFormatted}</span>
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
            <span>Subscription Status</span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Link href="/dashboard" className="block w-full">
            <Button
              onClick={onClose}
              className="w-full py-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch FAANG Mock Interview</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Continue Browsing Plans
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>PCI-DSS Level 1 Secure Checkout powered by Razorpay</span>
        </div>
      </div>
    </div>
  );
}
