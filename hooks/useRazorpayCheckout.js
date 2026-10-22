"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

/**
 * useRazorpayCheckout Hook
 * Handles Razorpay checkout script loading, order creation,
 * checkout modal invocation (with sandbox support), and cryptographic verification.
 */
export function useRazorpayCheckout() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activePlan, setActivePlan] = useState("starter");
  const [checkoutError, setCheckoutError] = useState(null);

  // Sync active plan from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("prepsmart_subscription");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.status === "active" && parsed?.planId) {
            setActivePlan(parsed.planId);
          }
        }
      } catch (e) {}

      const handleUpdate = () => {
        try {
          const stored = localStorage.getItem("prepsmart_subscription");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed?.status === "active" && parsed?.planId) {
              setActivePlan(parsed.planId);
            }
          }
        } catch (e) {}
      };

      window.addEventListener("prepsmart_subscription_updated", handleUpdate);
      return () => window.removeEventListener("prepsmart_subscription_updated", handleUpdate);
    }
  }, []);

  // Ensure Razorpay SDK script is loaded
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.warn("Could not load external Razorpay checkout.js; falling back to sandbox simulator.");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleCheckout = useCallback(
    async ({ plan, billingCycle = "annual", currency = "INR", user, onSuccess, onError }) => {
      if (!plan || plan.id === "starter") {
        toast.info("You are currently enjoying the Starter Community plan.");
        return;
      }

      setIsProcessing(true);
      setCheckoutError(null);
      toast.loading(`Preparing secure Razorpay checkout for ${plan.name}...`);

      try {
        // 1. Create order on server
        const res = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: plan.id,
            billingCycle,
            currency,
          }),
        });

        const orderData = await res.json();
        toast.dismiss();

        if (!res.ok || !orderData.success) {
          throw new Error(orderData.error || "Failed to initiate payment order");
        }

        // 2. Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();

        // Check if we should launch real Razorpay popup or test sandbox simulator
        const isRealSdk = scriptLoaded && window.Razorpay && !orderData.isSandbox;

        if (isRealSdk) {
          const options = {
            key: orderData.keyId,
            amount: orderData.amount,
            currency: orderData.currency,
            name: "PrepSmart AI",
            description: `${orderData.planName} (${billingCycle === "annual" ? "Annual" : "Monthly"})`,
            order_id: orderData.orderId,
            prefill: {
              name: user?.name || user?.fullName || "Candidate",
              email: user?.email || user?.primaryEmailAddress?.emailAddress || "candidate@prepsmart.ai",
              contact: user?.phone || user?.phoneNumber || "",
            },
            theme: {
              color: "#2563eb",
            },
            modal: {
              ondismiss: () => {
                setIsProcessing(false);
                toast.info("Payment checkout cancelled.");
              },
            },
            handler: async (response) => {
              toast.loading("Verifying transaction signature with Razorpay...");
              try {
                const verifyRes = await fetch("/api/razorpay/verify-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    planId: plan.id,
                    billingCycle,
                    userEmail: user?.email,
                  }),
                });

                const verifyData = await verifyRes.json();
                toast.dismiss();

                if (verifyData.success && verifyData.verified) {
                  localStorage.setItem("prepsmart_subscription", JSON.stringify(verifyData.subscription));
                  setActivePlan(plan.id);
                  window.dispatchEvent(new CustomEvent("prepsmart_subscription_updated"));
                  toast.success(`Success! You have upgraded to ${plan.name}!`);
                  if (onSuccess) onSuccess({ plan, orderData, verifyData, response });
                } else {
                  throw new Error(verifyData.error || "Payment signature verification failed");
                }
              } catch (err) {
                toast.error(err.message || "Payment verification failed");
                if (onError) onError(err);
              } finally {
                setIsProcessing(false);
              }
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.on("payment.failed", (failedRes) => {
            setIsProcessing(false);
            toast.error(failedRes?.error?.description || "Payment failed. Please try another method.");
            if (onError) onError(failedRes?.error);
          });
          rzp.open();
        } else {
          // 3. Fallback Test Simulator (For development sandbox and offline testing)
          const mockPaymentId = `pay_mock_${Date.now()}`;
          const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 15)}`;

          toast.loading("Simulating Razorpay Test Gateway Authorization...");
          await new Promise((r) => setTimeout(r, 900));

          const verifyRes = await fetch("/api/razorpay/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: orderData.orderId,
              razorpay_payment_id: mockPaymentId,
              razorpay_signature: mockSignature,
              planId: plan.id,
              billingCycle,
              isSandbox: true,
              userEmail: user?.email,
            }),
          });

          const verifyData = await verifyRes.json();
          toast.dismiss();

          if (verifyData.success) {
            localStorage.setItem("prepsmart_subscription", JSON.stringify(verifyData.subscription));
            setActivePlan(plan.id);
            window.dispatchEvent(new CustomEvent("prepsmart_subscription_updated"));
            toast.success(`Payment Confirmed! You are now upgraded to ${plan.name}!`);
            if (onSuccess) {
              onSuccess({
                plan,
                orderData,
                verifyData,
                response: {
                  razorpay_order_id: orderData.orderId,
                  razorpay_payment_id: mockPaymentId,
                },
              });
            }
          } else {
            throw new Error(verifyData.error || "Simulation error");
          }
          setIsProcessing(false);
        }
      } catch (err) {
        toast.dismiss();
        setIsProcessing(false);
        setCheckoutError(err.message);
        toast.error(err.message || "Could not complete payment checkout");
        if (onError) onError(err);
      }
    },
    []
  );

  return {
    isProcessing,
    activePlan,
    checkoutError,
    handleCheckout,
  };
}
