/**
 * DropScale Commerce - Main Application Script
 * Features:
 * - Lucide Icons initialization
 * - Progressive Disclosure (Dynamic form fields)
 * - Real-Time Google Sheets Webhook Integration
 * - LocalStorage Persistent Backup
 * - Animated Success Modal & Countdown
 * - Smart WhatsApp URL generation with personalized message
 * - Interactive FAQ Accordion
 */

// ==============================================================================
// CONFIGURACIÓN DE GOOGLE SHEETS
// Pega aquí la URL de tu aplicación web de Google Apps Script (termina en /exec)
// Si está vacía, los datos se respaldan en LocalStorage y WhatsApp funciona igual.
// ==============================================================================
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwNH2-EkmWFUbDqS8NXxHb7IbplNL7cPtk8DZdHaVbfALZb0s7noDrbea6EcO62bxyX/exec';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Progressive Disclosure for "Ha Vendido Anteriormente"
  const haVendidoSelect = document.getElementById('haVendido');
  const conditionalGroup = document.getElementById('conditionalExperienceGroup');
  const ventasDiariasSelect = document.getElementById('ventasDiarias');
  const productoAnteriorInput = document.getElementById('productoAnterior');
  const nichoSelect = document.getElementById('nicho');

  if (haVendidoSelect && conditionalGroup) {
    haVendidoSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      if (value === 'Sí') {
        conditionalGroup.classList.remove('hidden-smooth');
      } else {
        conditionalGroup.classList.add('hidden-smooth');
        if (ventasDiariasSelect) ventasDiariasSelect.value = '';
        if (productoAnteriorInput) productoAnteriorInput.value = '';
      }
    });
  }

  // 3. Form Handling & Real-time Google Sheets Sync
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

      // Form fields extraction
      const nombre = document.getElementById('nombre').value.trim();
      const apellido = document.getElementById('apellido').value.trim();
      const celular = document.getElementById('celular').value.trim();
      const correo = document.getElementById('correo').value.trim() || 'No proporcionado';
      const haVendido = haVendidoSelect ? haVendidoSelect.value : 'No especificado';
      
      const ventasDiarias = (haVendido === 'Sí' && ventasDiariasSelect && ventasDiariasSelect.value) 
        ? ventasDiariasSelect.value 
        : (haVendido === 'No' ? '0 pedidos (Principiante)' : 'No especificado');

      const productoAnterior = (haVendido === 'Sí' && productoAnteriorInput && productoAnteriorInput.value.trim()) 
        ? productoAnteriorInput.value.trim() 
        : (haVendido === 'No' ? 'No aplica (Primera tienda)' : 'No especificado');

      const nicho = nichoSelect && nichoSelect.value ? nichoSelect.value : '';
      const productoNuevo = document.getElementById('productoNuevo').value.trim() || 'Por definir con el asesor';

      // Validation check
      let hasError = false;
      const requiredInputs = [
        { el: document.getElementById('nombre'), val: nombre },
        { el: document.getElementById('apellido'), val: apellido },
        { el: document.getElementById('celular'), val: celular },
        { el: haVendidoSelect, val: haVendido },
        { el: nichoSelect, val: nicho }
      ];

      requiredInputs.forEach(item => {
        if (!item.el) return;
        const parentCol = item.el.closest('.relative') || item.el.parentElement;
        const errorMsg = parentCol.parentElement.querySelector('.error-msg');
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

      // Disable button during sync
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="inline-block animate-spin mr-2">⟳</span>
        <span>Guardando y conectando...</span>
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
        ventasDiarias,
        nicho,
        productoAnterior,
        productoNuevo
      };

      // 1. Respaldo persistente en LocalStorage del navegador
      try {
        const existingLeads = JSON.parse(localStorage.getItem('dropscale_leads') || '[]');
        existingLeads.push(leadData);
        localStorage.setItem('dropscale_leads', JSON.stringify(existingLeads));
      } catch (err) {
        console.warn('LocalStorage no accesible:', err);
      }

      // 2. Envío en segundo plano a Google Sheets vía Webhook (si está configurada la URL)
      if (GOOGLE_SHEETS_WEBHOOK_URL && GOOGLE_SHEETS_WEBHOOK_URL.trim().length > 10) {
        fetch(GOOGLE_SHEETS_WEBHOOK_URL.trim(), {
          method: 'POST',
          mode: 'no-cors', // Obligatorio para Webhooks de Google Apps Script
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(leadData)
        }).catch(err => {
          console.warn('Sincronización con Google Sheets en segundo plano:', err);
        });
      }

      // 3. Preparar mensaje inteligente para WhatsApp
      const whatsappBase = 'https://wa.me/3105420351';
      let message = `Hola, mi nombre es *${nombre} ${apellido}* 👋.\n\n` +
                    `Acabo de postularme en DropScale para el diagnóstico comercial sobre *E-commerce, Fulfillment y Dropshipping*.\n\n` +
                    `📱 *Celular:* ${celular}\n` +
                    `📧 *Correo:* ${correo}\n` +
                    `🎯 *Nicho de mercado:* ${nicho}\n` +
                    `🛒 *¿He vendido antes?:* ${haVendido}\n`;

      if (haVendido === 'Sí') {
        message += `📦 *Ventas diarias aprox:* ${ventasDiarias}\n` +
                   `🏷️ *Experiencia previa:* ${productoAnterior}\n`;
      }
      if (productoNuevo && productoNuevo !== 'Por definir con el asesor') {
        message += `✨ *Producto específico de interés:* ${productoNuevo}\n`;
      }
      message += `\nQuedo a la espera de coordinar la llamada con un asesor. ¡Muchas gracias!`;

      const whatsappUrl = `${whatsappBase}?text=${encodeURIComponent(message)}`;
      modalWhatsappLink.href = whatsappUrl;

      // 3. Registrar evento de conversión en Google Analytics 4 (GA4)
      const trackEvent = (eventName, params) => {
        if (typeof window.gtag === 'function') {
          window.gtag('event', eventName, params);
        } else if (typeof gtag === 'function') {
          gtag('event', eventName, params);
        } else if (window.dataLayer) {
          window.dataLayer.push({ event: eventName, ...params });
        }
      };

      trackEvent('generate_lead', {
        event_category: 'Lead',
        event_label: nicho,
        nicho: nicho,
        ha_vendido: haVendido,
        ventas_diarias: ventasDiarias
      });
      trackEvent('submit_questionnaire', {
        event_category: 'Cuestionario',
        nicho: nicho,
        ha_vendido: haVendido
      });

      // 4. Mostrar Modal de éxito y cuenta regresiva
      showModal(whatsappUrl);

      // 5. Limpiar todas las casillas del formulario y ocultar campos condicionales
      leadForm.reset();
      if (conditionalGroup) {
        conditionalGroup.classList.add('hidden-smooth');
      }
      if (ventasDiariasSelect) ventasDiariasSelect.value = '';
      if (productoAnteriorInput) productoAnteriorInput.value = '';
      if (nichoSelect) nichoSelect.value = '';
      if (haVendidoSelect) haVendidoSelect.value = '';

      // Remover cualquier clase de error residual
      leadForm.querySelectorAll('.border-rose-500').forEach(el => el.classList.remove('border-rose-500'));
      leadForm.querySelectorAll('.error-msg').forEach(el => el.classList.add('hidden'));

      // 6. Restaurar botón
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <i data-lucide="send" class="w-5 h-5"></i>
          <span>Enviar Postulación y Conectar por WhatsApp</span>
        `;
        if (window.lucide) window.lucide.createIcons();
      }, 1000);
    });
  }

  // 4. Success Modal & Countdown Logic
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
        // Automatically open WhatsApp in a new tab or redirect
        window.open(redirectUrl, '_blank');
      }
    }, 1000);
  }

  function hideModal() {
    if (!successModal || !modalCard) return;
    if (countdownInterval) clearInterval(countdownInterval);

    successModal.classList.remove('opacity-100', 'pointer-events-auto');
    successModal.classList.add('opacity-0', 'pointer-events-none');
    modalCard.classList.remove('scale-100');
    modalCard.classList.add('scale-95');
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

  // 5. Interactive FAQ Accordion
  const faqToggles = document.querySelectorAll('.faq-toggle');

  faqToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const content = toggle.nextElementSibling;
      const icon = toggle.querySelector('.faq-icon');
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';

      // Close all other FAQs for clean single-open accordion feel
      faqToggles.forEach(otherToggle => {
        if (otherToggle !== toggle) {
          otherToggle.setAttribute('aria-expanded', 'false');
          const otherContent = otherToggle.nextElementSibling;
          const otherIcon = otherToggle.querySelector('.faq-icon');
          if (otherContent) otherContent.classList.add('hidden');
          if (otherIcon) otherIcon.classList.remove('rotate-180');
        }
      });

      // Toggle current
      if (isExpanded) {
        toggle.setAttribute('aria-expanded', 'false');
        if (content) content.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        if (content) content.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      }
    });
  });

  // 6. Smooth Scroll for Navigation Anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // 7. Rastrear Clics e Interacciones en Google Analytics 4 (GA4)
  document.addEventListener('click', (e) => {
    const trackEvent = (eventName, params) => {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      } else if (typeof gtag === 'function') {
        gtag('event', eventName, params);
      } else if (window.dataLayer) {
        window.dataLayer.push({ event: eventName, ...params });
      }
    };

    // A. Clics en WhatsApp
    const waLink = e.target.closest('a[href*="wa.me"]');
    if (waLink) {
      const location = waLink.closest('header') ? 'navbar' 
                     : waLink.closest('#successModal') ? 'success_modal'
                     : waLink.closest('footer') ? 'footer'
                     : waLink.closest('aside') ? 'floating_button' 
                     : 'hero_content';

      trackEvent('click_whatsapp', {
        event_category: 'Engagement',
        event_label: location,
        location: location
      });
    }

    // B. Clics en botones CTA que llevan al formulario (#registro-form)
    const ctaFormLink = e.target.closest('a[href="#registro-form"]');
    if (ctaFormLink) {
      const ctaLocation = ctaFormLink.closest('nav') ? 'navbar' : 'hero_button';
      trackEvent('click_cta_form', {
        event_category: 'Engagement',
        event_label: ctaLocation
      });
    }
  });
});
