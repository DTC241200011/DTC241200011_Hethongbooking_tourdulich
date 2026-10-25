document.addEventListener('DOMContentLoaded', () => {
  // Format VND Helper
  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  // 1. Interactive Booking Form Price Calculator
  const tourPriceElem = document.getElementById('tourPriceDisplay');
  const adultsSelect = document.getElementById('adultsCount');
  const childrenSelect = document.getElementById('childrenCount');
  const adultPreview = document.getElementById('adultTotalPreview');
  const childPreview = document.getElementById('childTotalPreview');
  const grandTotalPreview = document.getElementById('grandTotalPreview');
  const departureDateInput = document.getElementById('departureDate');

  if (tourPriceElem && adultsSelect && childrenSelect) {
    const basePrice = parseFloat(tourPriceElem.getAttribute('data-price')) || 0;
    const childPrice = basePrice * 0.7; // 70% of adult price

    function updatePrice() {
      const adults = parseInt(adultsSelect.value, 10) || 1;
      const children = parseInt(childrenSelect.value, 10) || 0;

      const adultTotal = adults * basePrice;
      const childTotal = children * childPrice;
      const grandTotal = adultTotal + childTotal;

      if (adultPreview) adultPreview.textContent = formatVND(adultTotal);
      if (childPreview) childPreview.textContent = formatVND(childTotal);
      if (grandTotalPreview) grandTotalPreview.textContent = formatVND(grandTotal);
    }

    adultsSelect.addEventListener('change', updatePrice);
    childrenSelect.addEventListener('change', updatePrice);
    updatePrice();

    // Set min date to tomorrow
    if (departureDateInput) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      departureDateInput.min = tomorrow.toISOString().split('T')[0];
      if (!departureDateInput.value) {
        departureDateInput.value = tomorrow.toISOString().split('T')[0];
      }
    }
  }

  // 2. Admin: Update Booking Status
  const statusSelects = document.querySelectorAll('.status-select');
  statusSelects.forEach(select => {
    select.addEventListener('change', async (e) => {
      const bookingId = e.target.getAttribute('data-id');
      const newStatus = e.target.value;
      const originalValue = e.target.getAttribute('data-original') || newStatus;

      try {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (data.success) {
          e.target.setAttribute('data-original', newStatus);
          // Visual feedback
          e.target.classList.add('border-success');
          setTimeout(() => e.target.classList.remove('border-success'), 1500);
        } else {
          alert('Lỗi cập nhật trạng thái: ' + data.error);
          e.target.value = originalValue;
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ: ' + err.message);
        e.target.value = originalValue;
      }
    });
  });

  // 3. Admin: Create New Tour Form
  const createTourForm = document.getElementById('createTourForm');
  if (createTourForm) {
    createTourForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(createTourForm);
      const payload = {
        title: formData.get('title'),
        destination: formData.get('destination'),
        duration: formData.get('duration'),
        price: parseFloat(formData.get('price')),
        max_participants: parseInt(formData.get('max_participants'), 10) || 30,
        departure_location: formData.get('departure_location'),
        transport: formData.get('transport'),
        image_url: formData.get('image_url'),
        description: formData.get('description'),
        featured: formData.get('featured') === 'on'
      };

      try {
        const res = await fetch('/api/tours', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          alert('Thêm tour du lịch thành công!');
          window.location.reload();
        } else {
          alert('Lỗi tạo tour: ' + data.error);
        }
      } catch (err) {
        alert('Lỗi kết nối máy chủ: ' + err.message);
      }
    });
  }

  // 4. Admin: Soft Delete / Deactivate Tour
  const deleteTourBtns = document.querySelectorAll('.delete-tour-btn');
  deleteTourBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const tourId = btn.getAttribute('data-id');
      const tourTitle = btn.getAttribute('data-title');
      if (confirm(`Bạn có chắc chắn muốn xóa/ngừng bán tour "${tourTitle}"?`)) {
        try {
          const res = await fetch(`/api/tours/${tourId}`, { method: 'DELETE' });
          const data = await res.json();
          if (data.success) {
            const row = document.getElementById(`tour-row-${tourId}`);
            if (row) row.remove();
          } else {
            alert('Lỗi khi xóa tour: ' + data.error);
          }
        } catch (err) {
          alert('Lỗi kết nối máy chủ: ' + err.message);
        }
      }
    });
  });
});

