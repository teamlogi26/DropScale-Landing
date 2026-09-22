/**
 * DropScale / Nexus Commerce - Main Application Script
 * Features:
 * - Lucide Icons initialization
 * - Progressive Disclosure (Dynamic form fields)
 * - CSV Export for Microsoft Excel (UTF-8 BOM formatted)
 * - Animated Success Modal & Countdown
 * - Smart WhatsApp URL generation with personalized message
 * - Interactive FAQ Accordion
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Progressive Disclosure for "Ha Vendido Anteriormente"
  const haVendidoSelect = document.getElementById('haVendido');
  const conditionalGroup = document.getElementById('conditionalExperienceGroup');
  const cuantoHaVendidoInput = document.getElementById('cuantoHaVendido');
  const productoAnteriorInput = document.getElementById('productoAnterior');

  if (haVendidoSelect && conditionalGroup) {
    haVendidoSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      if (value === 'Sí') {
        conditionalGroup.classList.remove('hidden-smooth');
      } else {
        conditionalGroup.classList.add('hidden-smooth');
        cuantoHaVendidoInput.value = '';
        productoAnteriorInput.value = '';
      }
    });
  }

  // 3. Form Handling & CSV Generation
  const leadForm = document.getElementById('leadForm');
  const successModal = document.getElementById('successModal');
  const modalCard = document.getElementById('modalCard');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const countdownTimer = document.getElementById('countdownTimer');
  const modalWhatsappLink = document.getElementById('modalWhatsappLink');
  const submitBtn = document.getElementById('submitBtn');

  let countdownInterval = null;

  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Form validation
      const nombre = document.getElementById('nombre').value.trim();
      const apellido = document.getElementById('apellido').value.trim();
      const celular = document.getElementById('celular').value.trim();
      const correo = document.getElementById('correo').value.trim() || 'No proporcionado';
      const haVendido = haVendidoSelect.value;
      const cuantoHaVendido = cuantoHaVendidoInput.value.trim() || (haVendido === 'No' ? 'No aplica (Principiante)' : 'No especificado');
      const productoAnterior = productoAnteriorInput.value.trim() || (haVendido === 'No' ? 'No aplica' : 'No especificado');
      const productoNuevo = document.getElementById('productoNuevo').value.trim() || 'Por definir con el asesor';

      // Basic required checks
      let hasError = false;
      const requiredInputs = [
        { el: document.getElementById('nombre'), val: nombre },
        { el: document.getElementById('apellido'), val: apellido },
        { el: document.getElementById('celular'), val: celular },
        { el: haVendidoSelect, val: haVendido }
      ];

      requiredInputs.forEach(item => {
        const errorMsg = item.el.closest('div').parentElement.querySelector('.error-msg');
        if (!item.val) {
          hasError = true;
          item.el.classList.add('border-rose-500');
          if (errorMsg) errorMsg.classList.remove('hidden');
        } else {
          item.el.classList.remove('border-rose-500');
          if (errorMsg) errorMsg.classList.add('hidden');
        }
      });

      if (hasError) {
        return;
      }

      // Disable button during process
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block animate-spin mr-2">⟳</span>
        <span>Generando CSV y Conectando...</span>
      `;

      // Data record object
      const now = new Date();
      const formattedDate = now.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) + ' ' + now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const leadData = {
        fecha: formattedDate,
        nombre,
        apellido,
        celular,
        correo,
        haVendido,
        cuantoHaVendido,
        productoAnterior,
        productoNuevo
      };

      // Store in LocalStorage (simulating persistent database)
      try {
        const existingLeads = JSON.parse(localStorage.getItem('dropscale_leads') || '[]');
        existingLeads.push(leadData);
        localStorage.setItem('dropscale_leads', JSON.stringify(existingLeads));
      } catch (err) {
        console.warn('LocalStorage not accessible:', err);
      }

      // Generate CSV file
      downloadCsvFile(leadData);

      // Setup WhatsApp URL
      const whatsappBase = 'https://wa.me/3105420351';
      let message = `Hola, mi nombre es *${nombre} ${apellido}* 👋.\n\n` +
                    `Acabo de registrarme en DropScale para la entrevista de diagnóstico comercial sobre *E-commerce, Fulfillment y Dropshipping*.\n\n` +
                    `📱 *Celular:* ${celular}\n` +
                    `📧 *Correo:* ${correo}\n` +
                    `🛒 *¿He vendido antes?:* ${haVendido}\n`;

      if (haVendido === 'Sí') {
        message += `💰 *Ventas aprox:* ${cuantoHaVendido}\n` +
                   `📦 *Producto previo:* ${productoAnterior}\n`;
      }
      if (productoNuevo && productoNuevo !== 'Por definir con el asesor') {
        message += `✨ *Interés en nuevo producto:* ${productoNuevo}\n`;
      }
      message += `\nQuedo a la espera de coordinar la fecha y hora de la llamada. ¡Gracias!`;

      const whatsappUrl = `${whatsappBase}?text=${encodeURIComponent(message)}`;
      modalWhatsappLink.href = whatsappUrl;

      // Show Success Modal
      showModal(whatsappUrl);

      // Reset submit button
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <i data-lucide="send" class="w-5 h-5"></i>
          <span>Enviar Postulación y Descargar Ficha (.CSV)</span>
        `;
        if (window.lucide) window.lucide.createIcons();
      }, 1000);
    });
  }

  // 4. CSV Download Function with UTF-8 BOM
  function downloadCsvFile(lead) {
    const headers = [
      'Fecha y Hora',
      'Nombre',
      'Apellido',
      'Celular',
      'Correo',
      'Ha Vendido Antes',
      'Monto Vendido',
      'Producto Comercializado Anteriormente',
      'Producto Nuevo de Interés'
    ];

    const values = [
      lead.fecha,
      lead.nombre,
      lead.apellido,
      lead.celular,
      lead.correo,
      lead.haVendido,
      lead.cuantoHaVendido,
      lead.productoAnterior,
      lead.productoNuevo
    ];

    // Helper to escape CSV values according to RFC 4180
    const escapeCsv = (val) => {
      const text = (val ?? '').toString();
      return `"${text.replace(/"/g, '""')}"`;
    };

    // Construct CSV String (Semicolon and Comma separated versions)
    // Semicolon is the default in Spanish Excel; we can also provide UTF-8 BOM which ensures accents render correctly
    const csvHeaderRow = headers.map(escapeCsv).join(';');
    const csvDataRow = values.map(escapeCsv).join(';');
    const csvContent = '\uFEFF' + csvHeaderRow + '\r\n' + csvDataRow + '\r\n';

    // Create download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    // Clean filename
    const cleanName = (lead.nombre + '_' + lead.apellido).replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `Lead_DropScale_${cleanName}_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // 5. Success Modal & Countdown Logic
  function showModal(redirectUrl) {
    if (!successModal || !modalCard) return;

    let seconds = 2;
    countdownTimer.textContent = seconds;

    // Show modal
    successModal.classList.remove('opacity-0', 'pointer-events-none');
    successModal.classList.add('opacity-100', 'pointer-events-auto');
    modalCard.classList.remove('scale-95');
    modalCard.classList.add('scale-100');

    // Countdown interval
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      seconds--;
      if (countdownTimer) countdownTimer.textContent = seconds;

      if (seconds <= 0) {
        clearInterval(countdownInterval);
        // Redirect to WhatsApp in a new tab
        window.open(redirectUrl, '_blank');
      }
    }, 1000);
  }

  function hideModal() {
    if (!successModal || !modalCard) return;
    if (countdownInterval) clearInterval(countdownInterval);

    successModal.classList.add('opacity-0', 'pointer-events-none');
    successModal.classList.remove('opacity-100', 'pointer-events-auto');
    modalCard.classList.add('scale-95');
    modalCard.classList.remove('scale-100');
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);
  }

  if (successModal) {
    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        hideModal();
      }
    });
  }

  // 6. FAQ Accordion Interaction
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const toggleBtn = item.querySelector('.faq-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isCurrentlyActive = item.classList.contains('active');

        // Close all other FAQs (accordion style)
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });

        // Toggle current FAQ
        if (!isCurrentlyActive) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  });

  // Smooth clear errors on typing
  const formInputs = document.querySelectorAll('#leadForm input, #leadForm select, #leadForm textarea');
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('border-rose-500');
      const errorMsg = input.closest('div').parentElement?.querySelector('.error-msg');
      if (errorMsg) errorMsg.classList.add('hidden');
    });
  });
});
