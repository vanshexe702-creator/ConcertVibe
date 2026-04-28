/**
 * Ticket Module — E-ticket rendering, QR code generation, and PDF download
 */

document.addEventListener('DOMContentLoaded', () => {
  renderTicket();
});

async function renderTicket() {
  // Try to get booking from localStorage first, then from URL param
  let booking = null;
  const stored = localStorage.getItem('lastBooking');
  if (stored) {
    booking = JSON.parse(stored);
  } else {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      try {
        const data = await api.get(`/bookings/${id}`);
        booking = data.booking;
      } catch (error) {
        showToast('Failed to load booking', 'error');
        return;
      }
    }
  }

  if (!booking) {
    showToast('No booking data found', 'error');
    return;
  }

  // Populate ticket fields
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('ticketConcert', booking.title);
  setEl('ticketArtist', '🎤 ' + booking.artist);
  setEl('ticketId', booking.booking_id);
  setEl('ticketName', booking.user_name);
  setEl('ticketVenue', booking.venue);
  setEl('ticketCity', booking.city);
  setEl('ticketDate', formatDate(booking.date));
  setEl('ticketTime', formatTime(booking.time));

  const seats = typeof booking.seats === 'string' ? JSON.parse(booking.seats) : booking.seats;
  setEl('ticketSeats', seats.join(', '));
  setEl('ticketAmount', formatCurrency(booking.total_amount));

  // Generate QR code
  const qrContainer = document.getElementById('ticketQR');
  if (qrContainer && typeof QRCode !== 'undefined') {
    const qrData = JSON.stringify({
      id: booking.booking_id,
      concert: booking.title,
      seats: seats,
      date: booking.date
    });
    try {
      const canvas = document.createElement('canvas');
      await QRCode.toCanvas(canvas, qrData, {
        width: 180,
        color: { dark: '#f1f0ff', light: '#222233' },
        margin: 2
      });
      qrContainer.innerHTML = '';
      qrContainer.appendChild(canvas);
    } catch (err) {
      qrContainer.innerHTML = '<p style="color:var(--text-muted);">QR Code</p>';
    }
  }

  // PDF download button
  const pdfBtn = document.getElementById('downloadPdfBtn');
  if (pdfBtn) {
    pdfBtn.addEventListener('click', () => generatePDF(booking, seats));
  }
}

/** Generate a PDF ticket using jsPDF */
function generatePDF(booking, seats) {
  if (typeof window.jspdf === 'undefined') {
    showToast('PDF library not loaded', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Header
  doc.setFillColor(147, 51, 234);
  doc.rect(0, 0, 210, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('ConcertVibe', 105, 22, { align: 'center' });
  doc.setFontSize(14);
  doc.text('E-Ticket', 105, 35, { align: 'center' });

  // Concert info
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.text(booking.title, 105, 65, { align: 'center' });
  doc.setFontSize(12);
  doc.text(booking.artist, 105, 75, { align: 'center' });

  // Details
  const startY = 95;
  const lineHeight = 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);

  const details = [
    ['Ticket ID', booking.booking_id],
    ['Name', booking.user_name],
    ['Venue', booking.venue + ', ' + booking.city],
    ['Date', formatDate(booking.date)],
    ['Time', formatTime(booking.time)],
    ['Seats', seats.join(', ')],
    ['Total Paid', formatCurrency(booking.total_amount)],
    ['Payment', booking.payment_method?.toUpperCase()],
    ['Status', booking.booking_status?.toUpperCase()]
  ];

  details.forEach((row, i) => {
    const y = startY + i * lineHeight;
    doc.setTextColor(100, 100, 100);
    doc.text(row[0] + ':', 30, y);
    doc.setTextColor(30, 30, 30);
    doc.text(row[1] || 'N/A', 80, y);
  });

  // Dashed line
  doc.setDrawColor(200, 200, 200);
  doc.setLineDashPattern([3, 3], 0);
  doc.line(20, startY + details.length * lineHeight + 5, 190, startY + details.length * lineHeight + 5);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Present this ticket at the venue entrance. © 2026 ConcertVibe', 105, 280, { align: 'center' });

  doc.save(`ConcertVibe-${booking.booking_id}.pdf`);
  showToast('PDF downloaded!', 'success');
}
