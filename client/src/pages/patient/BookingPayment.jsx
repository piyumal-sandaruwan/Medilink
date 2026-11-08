import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle2, ArrowRight, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/client.js';

export const BookingPayment = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payment, setPayment] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const refreshPaymentStatus = useCallback(async () => {
    const response = await api.get(`/payments/${appointmentId}/status`);
    if (response.success && response.data?.payment) {
      setPayment(response.data.payment);
      return response.data.payment;
    }
    return null;
  }, [appointmentId]);

  useEffect(() => {
    let active = true;
    const fetchAppointment = async () => {
      try {
        const response = await api.get('/appointments/mine');
        if (!active) return;
        const match = response.data?.find((item) => item._id === appointmentId);
        if (!match) {
          toast.error('Appointment reservation not found.');
          navigate('/patient/appointments');
          return;
        }
        setAppointment(match);
        setPayment(match.payment || null);
        if (searchParams.get('payment') === 'cancelled') {
          toast('PayHere checkout was cancelled. You can try again when ready.');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to load appointment details.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAppointment();
    return () => { active = false; };
  }, [appointmentId, navigate, searchParams]);

  // PayHere confirms payments asynchronously through its signed server callback.
  // The browser return URL itself is never treated as proof of payment.
  useEffect(() => {
    if (searchParams.get('payment') !== 'return' || ['paid', 'failed', 'cancelled', 'charged_back'].includes(payment?.status)) return undefined;
    let attempts = 0;
    setCheckingStatus(true);
    const timer = window.setInterval(async () => {
      attempts += 1;
      try {
        const latest = await refreshPaymentStatus();
        if (latest?.status === 'paid') {
          toast.success('PayHere payment verified. Your appointment is confirmed.');
          window.clearInterval(timer);
          setCheckingStatus(false);
        } else if (['failed', 'cancelled', 'charged_back'].includes(latest?.status)) {
          window.clearInterval(timer);
          setCheckingStatus(false);
          toast.error(`Payment status: ${latest.status.replace('_', ' ')}.`);
        } else if (attempts >= 20) {
          window.clearInterval(timer);
          setCheckingStatus(false);
          toast('Payment is still being verified. Refresh the status before trying again.');
        }
      } catch {
        if (attempts >= 20) {
          window.clearInterval(timer);
          setCheckingStatus(false);
        }
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [payment?.status, refreshPaymentStatus, searchParams]);

  const handlePayHereCheckout = async () => {
    setPaying(true);
    try {
      const response = await api.post(`/payments/${appointmentId}/payhere/checkout`);
      const { checkoutUrl, fields } = response.data || {};
      if (!checkoutUrl || !fields) throw new Error('PayHere checkout details were not returned.');
      const target = new URL(checkoutUrl);
      if (!['payhere.lk', 'www.payhere.lk', 'sandbox.payhere.lk'].includes(target.hostname)) {
        throw new Error('Unexpected PayHere checkout destination.');
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkoutUrl;
      form.style.display = 'none';
      Object.entries(fields).forEach(([name, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      toast.error(error.message || 'Unable to start PayHere checkout.');
      setPaying(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      const latest = await refreshPaymentStatus();
      if (latest?.status === 'paid') toast.success('Payment verified successfully.');
      else toast(`Current payment status: ${latest?.status || 'unknown'}.`);
    } catch (error) {
      toast.error(error.message || 'Unable to check payment status.');
    }
  };

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;
  }
  if (!appointment) return null;

  const { schedule, appointmentNo } = appointment;
  const doctor = schedule?.doctor;
  const hospital = schedule?.hospital;
  const amount = Number(payment?.amount ?? doctor?.channelingFee ?? 2500);
  const isPaid = payment?.status === 'paid';

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">{isPaid ? (appointment.status === 'cancelled' ? 'Payment Received – Refund Review' : 'Booking Confirmed') : 'Confirm Channeling & Payment'}</h1>
        <p className="text-sm text-slate-500 mt-1">Review your reserved session and complete your secure PayHere payment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 h-fit">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Reserved Session</span>
          <div className="text-center py-4 bg-brand-50 rounded-2xl border border-brand-100">
            <span className="text-xs text-brand-600 font-semibold uppercase">Appointment Number</span>
            <div className="text-3xl font-black text-brand-800 mt-0.5">#{appointmentNo}</div>
          </div>
          <div className="space-y-3 text-xs">
            <div><span className="text-slate-400 block">Doctor:</span><strong className="text-slate-800 text-sm font-bold">{doctor?.user?.name}</strong><span className="text-brand-600 font-medium block">{doctor?.specialization?.name}</span></div>
            <div><span className="text-slate-400 block">Hospital / Location:</span><strong className="text-slate-800 font-semibold">{hospital?.name}</strong><p className="text-slate-500">{hospital?.address}</p></div>
            <div><span className="text-slate-400 block">Session Date & Time:</span><strong className="text-slate-800 font-semibold">{new Date(schedule?.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} at {schedule?.startTime}</strong></div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex justify-between items-center"><span className="text-xs font-bold text-slate-500 uppercase">Amount Due:</span><span className="text-xl font-black text-brand-700">LKR {amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>

        <div className="md:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {isPaid ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto"><CheckCircle2 className="w-10 h-10" /></div>
              <div><h2 className="text-2xl font-black text-slate-900">{appointment.status === 'cancelled' ? 'Payment Received' : 'Payment Completed!'}</h2><p className="text-sm text-slate-500 mt-1">{appointment.status === 'cancelled' ? 'This appointment was cancelled before payment confirmation. Please contact MediLink support for refund review.' : 'PayHere verified your payment and your appointment is confirmed.'}</p></div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left text-sm space-y-2"><div className="flex justify-between gap-3"><span className="text-slate-500">Payment reference</span><strong className="font-mono break-all">{payment.transactionRef || payment.gatewayPaymentId || payment.orderId}</strong></div><div className="flex justify-between"><span className="text-slate-500">Payment method</span><strong>{payment.gatewayMethod || 'PayHere'}</strong></div><div className="flex justify-between"><span className="text-slate-500">Amount</span><strong>LKR {amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong></div></div>
              <Link to="/patient/appointments" className="block w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl text-center">View My Appointments</Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100"><div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-brand-600" /><h3 className="font-bold text-slate-900">Secure PayHere Checkout</h3></div><span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">{payment?.method === 'payhere' ? 'PayHere' : 'Ready'}</span></div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" /><p>You will be redirected to PayHere to enter your payment details securely. MediLink does not collect or store your card number, expiry date or CVV.</p></div>
              {checkingStatus && <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex gap-2"><Clock className="w-4 h-4 shrink-0" />Waiting for PayHere to confirm the payment. This page checks the verified server status automatically.</div>}
              {payment?.status === 'failed' || payment?.status === 'cancelled' ? <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-700 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />The previous payment attempt was {payment.status}. You can safely try again.</div> : null}
              <button type="button" onClick={handlePayHereCheckout} disabled={paying || checkingStatus || payment?.status === 'charged_back'} className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"><span>{paying ? 'Connecting to PayHere…' : `Continue to PayHere · LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`}</span><ArrowRight className="w-4 h-4" /></button>
              <button type="button" onClick={handleCheckStatus} className="w-full text-sm font-semibold text-brand-700 hover:text-brand-900">Check payment status</button>
              <p className="text-[11px] text-slate-400 text-center">Payment is confirmed only after PayHere sends a valid, signed server notification.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPayment;
