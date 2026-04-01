/**
 * Meey CRM — Form Tracking Script
 * Ghi nhận lead, validate, tracking events, gửi data đến webhook/Google Sheets.
 *
 * Cấu hình:
 *   - WEBHOOK_URL: URL nhận POST data (Google Apps Script / Zapier / n8n / ...)
 *   - ENABLE_TRACKING: Bật/tắt tracking console logs
 */

// ===================== CONFIG =====================
const CONFIG = {
    WEBHOOK_URL: '', // <-- Dán URL Google Apps Script hoặc webhook tại đây
    ENABLE_TRACKING: true,
    TRACKING_EVENTS: [],
};

// ===================== UTILITIES =====================
function getTimestamp() {
    return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

function generateLeadId() {
    const now = Date.now().toString(36);
    const rand = Math.random().toString(36).substring(2, 6);
    return `LEAD-${now}-${rand}`.toUpperCase();
}

function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || '',
        utm_content: params.get('utm_content') || '',
        utm_term: params.get('utm_term') || '',
    };
}

function trackEvent(category, action, label = '') {
    const event = { category, action, label, timestamp: getTimestamp() };
    CONFIG.TRACKING_EVENTS.push(event);

    if (CONFIG.ENABLE_TRACKING) {
        console.log(`[Track] ${category} | ${action}${label ? ' | ' + label : ''}`);
    }

    // Google Analytics 4 (nếu có)
    if (typeof gtag === 'function') {
        gtag('event', action, {
            event_category: category,
            event_label: label,
        });
    }
}

// ===================== VALIDATION =====================
const validators = {
    fullName(value) {
        if (!value.trim()) return 'Vui lòng nhập họ và tên';
        if (value.trim().length < 2) return 'Tên phải có ít nhất 2 ký tự';
        return '';
    },
    email(value) {
        if (!value.trim()) return 'Vui lòng nhập email';
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(value)) return 'Email không hợp lệ';
        return '';
    },
    phone(value) {
        if (!value.trim()) return 'Vui lòng nhập số điện thoại';
        const cleaned = value.replace(/[\s\-().]/g, '');
        if (!/^(0|\+84)\d{9,10}$/.test(cleaned)) return 'Số điện thoại không hợp lệ';
        return '';
    },
    jobTitle(value) {
        if (!value) return 'Vui lòng chọn vị trí công việc';
        return '';
    },
    city(value) {
        if (!value) return 'Vui lòng chọn tỉnh/thành phố';
        return '';
    },
    teamSize(value) {
        if (!value) return 'Vui lòng chọn quy mô nhân sự';
        return '';
    },
};

function showError(field, message) {
    const input = document.querySelector(`[name="${field}"]`);
    const errorEl = document.querySelector(`[data-field="${field}"]`);
    if (input) input.classList.toggle('error', !!message);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.toggle('visible', !!message);
    }
}

function validateField(name, value) {
    if (validators[name]) {
        const error = validators[name](value);
        showError(name, error);
        return !error;
    }
    return true;
}

function validateForm(formData) {
    let isValid = true;
    for (const [name, fn] of Object.entries(validators)) {
        const value = formData.get(name) || '';
        if (!validateField(name, value)) {
            isValid = false;
        }
    }
    return isValid;
}

// ===================== FORM SUBMIT =====================
async function submitForm(data) {
    // Nếu chưa cấu hình webhook → chỉ log ra console
    if (!CONFIG.WEBHOOK_URL) {
        console.warn('[Form] WEBHOOK_URL chưa được cấu hình. Data sẽ chỉ log ra console.');
        console.table(data);
        return { success: true, mode: 'local' };
    }

    const response = await fetch(CONFIG.WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    return { success: true, mode: 'remote' };
}

function resetForm() {
    const form = document.getElementById('leadForm');
    const successMsg = document.getElementById('successMessage');
    form.reset();
    form.style.display = '';
    successMsg.style.display = 'none';
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    document.querySelectorAll('.form-input, .form-select').forEach(el => {
        el.classList.remove('error');
    });
    document.querySelector('.job-other-input').style.display = 'none';
    trackEvent('Form', 'reset');
}

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('leadForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const successMsg = document.getElementById('successMessage');
    const jobSelect = document.querySelector('[name="jobTitle"]');
    const jobOther = document.querySelector('.job-other-input');

    // Track page view
    trackEvent('Page', 'view', document.title);
    trackEvent('UTM', 'params', JSON.stringify(getUTMParams()));

    // Job title "Khác" toggle
    jobSelect.addEventListener('change', () => {
        const isOther = jobSelect.value === 'other';
        jobOther.style.display = isOther ? 'block' : 'none';
        if (isOther) jobOther.focus();
        trackEvent('Form', 'select_job', jobSelect.value);
    });

    // Real-time validation on blur
    form.querySelectorAll('.form-input, .form-select').forEach(input => {
        input.addEventListener('blur', () => {
            if (input.name && validators[input.name]) {
                validateField(input.name, input.value);
            }
        });
        input.addEventListener('focus', () => {
            trackEvent('Form', 'focus', input.name || input.type);
        });
    });

    // Track field interactions
    form.querySelectorAll('.form-select').forEach(select => {
        select.addEventListener('change', () => {
            trackEvent('Form', 'select_change', `${select.name}: ${select.value}`);
        });
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        // Handle jobTitle "other"
        if (formData.get('jobTitle') === 'other') {
            const otherValue = formData.get('jobTitleOther');
            if (!otherValue || !otherValue.trim()) {
                showError('jobTitle', 'Vui lòng nhập vị trí công việc');
                jobOther.classList.add('error');
                return;
            }
            formData.set('jobTitle', otherValue.trim());
        }

        // Validate
        if (!validateForm(formData)) {
            trackEvent('Form', 'validation_failed');
            // Scroll to first error
            const firstError = form.querySelector('.form-input.error, .form-select.error');
            if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        // Disable button, show loading
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';

        // Build payload
        const payload = {
            leadId: generateLeadId(),
            timestamp: getTimestamp(),
            fullName: formData.get('fullName').trim(),
            email: formData.get('email').trim(),
            phone: formData.get('phone').trim(),
            jobTitle: formData.get('jobTitle'),
            company: (formData.get('company') || '').trim(),
            city: formData.get('city'),
            teamSize: formData.get('teamSize'),
            plan: formData.get('plan') || '',
            note: (formData.get('note') || '').trim(),
            utm: getUTMParams(),
            referrer: document.referrer || 'direct',
            page: window.location.href,
            userAgent: navigator.userAgent,
            trackingEvents: CONFIG.TRACKING_EVENTS,
        };

        trackEvent('Form', 'submit_attempt', payload.leadId);

        try {
            const result = await submitForm(payload);
            trackEvent('Form', 'submit_success', payload.leadId);

            // Show success
            form.style.display = 'none';
            successMsg.style.display = 'block';
        } catch (err) {
            console.error('[Form] Submit error:', err);
            trackEvent('Form', 'submit_error', err.message);
            alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
        } finally {
            submitBtn.disabled = false;
            btnText.style.display = '';
            btnLoading.style.display = 'none';
        }
    });

    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollPct = Math.round(
            (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        if (scrollPct > maxScroll) {
            maxScroll = scrollPct;
            if ([25, 50, 75, 100].includes(scrollPct)) {
                trackEvent('Scroll', 'depth', `${scrollPct}%`);
            }
        }
    });

    // Track time on page
    const startTime = Date.now();
    window.addEventListener('beforeunload', () => {
        const duration = Math.round((Date.now() - startTime) / 1000);
        trackEvent('Page', 'time_on_page', `${duration}s`);
    });

    console.log('[Meey CRM] Form tracking initialized');
    console.log('[Meey CRM] UTM params:', getUTMParams());
});
