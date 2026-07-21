import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowRight,
  FiCalendar,
  FiBox,
  FiCheckCircle,
  FiCreditCard,
  FiLock,
  FiSmartphone,
} from 'react-icons/fi';
import { getCourseById } from './courseData.js';
import StudentShell from '../components/StudentShell.jsx';

const PAYMENT_API = 'https://3.111.47.41:8081/api/payment';

export default function CoursePayment({ onSignOut }) {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getCourseById(courseId);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!course) return <Navigate to="/courses" replace />;

  const total = course.price;
  const deposit = Math.round(total * 0.2);
  const payable = total - deposit;
  const paymentPayload = {
    amount: Number(payable),
    currency: 'INR',
    courseId: course.paymentCourseId,
    courseName: course.title,
  };

  const handlePay = async () => {
    if (processing) return;
    setError('');

    if (!window.Razorpay) {
      setError('Payment library failed to load. Please refresh and try again.');
      return;
    }

    setProcessing(true);
    try {
      // 1. Create an order on the backend (amount in rupees, backend handles paise conversion)
      const order = await fetch(`${PAYMENT_API}/create-order`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentPayload),

      }).then((r) => {
        if (!r.ok) throw new Error('Failed to create order');
        return r.json();
       
      });


      const { keyId, orderId, amount, currency } = order;

      // 2. Open the Razorpay checkout
      const rzp = new window.Razorpay({
        key: keyId,
        order_id: orderId,
        amount,
        currency,
        name: course.title,
        handler: async (res) => {
          try {
            const verifyRes = await fetch(`${PAYMENT_API}/verify`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: res.razorpay_order_id,
                razorpayPaymentId: res.razorpay_payment_id,
                razorpaySignature: res.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) throw new Error('Payment verification failed');
            navigate(`/courses/${course.id}/payment-success`);
          } catch (err) {
            setError(err.message || 'Payment verification failed. Please contact support.');
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      });

      rzp.on('payment.failed', (response) => {
        setError(response?.error?.description || 'Payment failed. Please try again.');
        setProcessing(false);
      });

      rzp.open();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <StudentShell onSignOut={onSignOut}>
      <main className="course-shell">
        <section className=" course-payment-shell">
          <div className="course-phone-topbar course-detail-header">
            <button type="button" className="mcq-topbar-back" aria-label="Go back" onClick={() => navigate(-1)}>
              <FiArrowLeft />
            </button>
            <span>Payment</span>
          </div>

          <div className="course-payment-layout">
            <div className="course-payment-main">
              <div className="payment-heading-card">
                <span>Checkout</span>
                <h1>Confirm Payment</h1>
                <p>Complete your transaction to finalize the seat reservation.</p>
              </div>

              <div className="payment-reserved-card">
                <div>
                  <span>Reserved Course</span>
                  <strong>{course.title}</strong>
                  <small>
                    <FiCalendar /> {course.date}
                    <span>{course.time}</span>
                  </small>
                </div>
                <FiBox />
              </div>
            </div>

            <aside className="payment-summary-card">
              <div className="order-summary payment-order-summary">
                <span>Order Summary</span>
                <div>
                  <p>Program Fee</p>
                  <strong>₹{total.toLocaleString()}</strong>
                </div>
                <div>
                  <p>Registration Deposit</p>
                  <strong>-₹{deposit.toLocaleString()}</strong>
                </div>
                <div>
                  <p>Total Amount</p>
                  <strong>₹{payable.toLocaleString()}</strong>
                </div>
              </div>

              <div className="payment-secure-note">
                <FiLock />
                Secure 256-bit SSL encrypted payment
              </div>

              {error && <p className="payment-error-note" role="alert">{error}</p>}

              <button
                type="button"
                className="course-booking-action payment-pay-button"
                onClick={handlePay}
                disabled={processing}
              >
                {processing ? 'Processing…' : <>Pay &amp; Secure Seat <FiArrowRight /></>}
              </button>
            </aside>
          </div>
        </section>
      </main>
    </StudentShell>
  );
}
