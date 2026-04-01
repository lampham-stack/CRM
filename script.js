// ============================================================
// MEEY CRM — LEAD FORM TRACKING + GOOGLE SHEET INTEGRATION
// ============================================================
// Chức năng:
//   1. Bắt UTM params từ URL → phân loại nguồn & campaign
//   2. Validate form
//   3. Gửi data đến Google Sheet qua Apps Script webhook
//   4. Tracking: page view, scroll, time on page, form interactions
// ============================================================

// ==================== CONFIG ====================
const CONFIG = {
    // ⬇️ DÁN URL Google Apps Script Web App tại đây
    GOOGLE_SHEET_URL: 'https://script.google.com/macros/s/AKfycby5kyPIpk_HGPeJ0vMCN6nwjiyhR-Y36jc479QIdpduK7bwOgO4QXB88hMkMb9MXjs-/exec',
    DEBUG: true, // true = log ra console
};

// ==================== UTM TRACKING ====================
function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        utm_source:   params.get('utm_source')   || '(direct)',
        utm_medium:   params.get('utm_medium')   || '(none)',
        utm_campaign: params.get('utm_campaign') || '(none)',
        utm_content:  params.get('utm_content')  || '',
        utm_term:     params.get('utm_term')     || '',
    };
}

// Lưu UTM vào sessionStorage (giữ khi user navigate trong page)
function saveUTM() {
    const utm = getUTMParams();
    // Chỉ lưu nếu có UTM thực (không phải direct)
    if (utm.utm_source !== '(direct)') {
        sessionStorage.setItem('meey_utm', JSON.stringify(utm));
    }
    return JSON.parse(sessionStorage.getItem('meey_utm') || JSON.stringify(utm));
}

// Phân loại nguồn dựa trên UTM
function classifySource(utm) {
    const src = (utm.utm_source || '').toLowerCase();
    const med = (utm.utm_medium || '').toLowerCase();

    if (med.includes('cpc') || med.includes('paid') || med.includes('ads'))
        return 'Paid Ads';
    if (src.includes('facebook') || src.includes('fb'))
        return 'Facebook';
    if (src.includes('google'))
        return med.includes('organic') ? 'Google Organic' : 'Google Ads';
    if (src.includes('zalo'))
        return 'Zalo';
    if (src.includes('tiktok'))
        return 'TikTok';
    if (src.includes('youtube') || src.includes('yt'))
        return 'YouTube';
    if (src.includes('email') || med.includes('email'))
        return 'Email';
    if (src === '(direct)')
        return 'Direct';
    if (med.includes('referral'))
        return 'Referral';
    return src || 'Khác';
}

// ==================== GENERATE LEAD ID ====================
function generateLeadId() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LEAD-${date}-${rand}`;
}

// ==================== VALIDATE ====================
function validatePhone(phone) {
    const cleaned = phone.replace(/[\s\-().]/g, '');
    return /^(0|\+84)\d{9,10}$/.test(cleaned);
}

function validateForm() {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    let errors = [];

    if (!fullName) errors.push('Vui lòng nhập họ và tên');
    if (!phone) errors.push('Vui lòng nhập số điện thoại');
    else if (!validatePhone(phone)) errors.push('Số điện thoại không hợp lệ');

    return errors;
}

// ==================== SUBMIT TO GOOGLE SHEET ====================
async function submitToGoogleSheet(data) {
    if (!CONFIG.GOOGLE_SHEET_URL) {
        console.warn('[Meey CRM] GOOGLE_SHEET_URL chưa cấu hình! Data chỉ log ra console:');
        console.table(data);
        return { success: true, mode: 'local' };
    }

    try {
        await fetch(CONFIG.GOOGLE_SHEET_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return { success: true, mode: 'remote' };
    } catch (err) {
        console.error('[Meey CRM] Gửi data thất bại:', err);
        throw err;
    }
}

// ==================== MAIN INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    const utm = saveUTM();
    const pageLoadTime = Date.now();

    if (CONFIG.DEBUG) {
        console.log('[Meey CRM] 🚀 Form tracking initialized');
        console.log('[Meey CRM] 📊 UTM:', utm);
        console.log('[Meey CRM] 🏷️ Nguồn:', classifySource(utm));
    }

    // ===== FORM SUBMIT =====
    const form = document.getElementById('leadForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate
        const errors = validateForm();
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }

        // Get values
        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();

        // Build payload — tất cả trường gửi về Sheet
        const payload = {
            leadId:       generateLeadId(),
            date:         new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
            time:         new Date().toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false }),
            fullName:     fullName,
            phone:        phone,
            // UTM — phân loại nguồn & campaign
            utm_source:   utm.utm_source,
            utm_medium:   utm.utm_medium,
            utm_campaign: utm.utm_campaign,
        };

        if (CONFIG.DEBUG) {
            console.log('[Meey CRM] 📤 Submitting lead:', payload);
        }

        // UI loading
        const submitBtn = document.getElementById('submitBtn');
        const btnText = document.getElementById('btnText');
        const btnLoading = document.getElementById('btnLoading');
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        try {
            const result = await submitToGoogleSheet(payload);

            if (CONFIG.DEBUG) {
                console.log('[Meey CRM] ✅ Submit success:', result);
            }

            // Ẩn form, hiện success
            document.querySelectorAll('.lead-form .form-group, .lead-form .btn-submit, .lead-form .form-disclaimer').forEach(el => {
                el.style.display = 'none';
            });
            document.getElementById('successMessage').style.display = 'block';

        } catch (err) {
            alert('Có lỗi xảy ra, vui lòng thử lại!');
            submitBtn.disabled = false;
            btnText.style.display = '';
            btnLoading.style.display = 'none';
        }
    });


    // ==================== EXISTING PAGE JS ====================
    // (Giữ nguyên các logic cũ từ landing page)

    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    // Pain Points slider tabs
    const painTabs = document.querySelectorAll('.pain-tab');
    const painContents = document.querySelectorAll('.pain-content');
    painTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            painTabs.forEach(t => t.classList.remove('active'));
            painContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('pain-' + tab.dataset.pain).classList.add('active');
        });
    });

    // Mobile menu toggle
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });
        mobileMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => mobileMenu.classList.remove('open'));
        });
    }

    // Feature tabs + arrows + dots
    const fTabs = document.querySelectorAll('.feature-tab');
    const fContents = document.querySelectorAll('.feature-content');
    const fDots = document.querySelectorAll('.feature-dot');
    let fIdx = 0;

    function switchFeature(i) {
        fTabs.forEach(t => t.classList.remove('active'));
        fContents.forEach(c => c.classList.remove('active'));
        fDots.forEach(d => d.classList.remove('active'));
        fTabs[i].classList.add('active');
        fContents[i].classList.add('active');
        fDots[i].classList.add('active');
        fIdx = i;
        fTabs[i].scrollIntoView({ behavior:'smooth', block:'nearest', inline:'center' });
    }

    fTabs.forEach((tab, i) => { tab.addEventListener('click', () => switchFeature(i)); });
    fDots.forEach((dot, i) => { dot.addEventListener('click', () => switchFeature(i)); });

    const fPrev = document.getElementById('fPrev');
    const fNext = document.getElementById('fNext');
    if (fPrev) fPrev.addEventListener('click', () => { switchFeature(fIdx > 0 ? fIdx - 1 : fContents.length - 1); });
    if (fNext) fNext.addEventListener('click', () => { switchFeature(fIdx < fContents.length - 1 ? fIdx + 1 : 0); });

    // Pricing toggle (month/year)
    document.querySelectorAll('.pricing-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pricing-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const p = btn.dataset.period;
            document.querySelectorAll('.plan-price').forEach(el => {
                if (el.dataset[p] !== undefined) el.childNodes[0].textContent = el.dataset[p] + ' ';
            });
        });
    });

    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const it = q.parentElement;
            const ans = it.querySelector('.faq-answer');
            const act = it.classList.contains('active');
            document.querySelectorAll('.faq-item').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-answer').style.maxHeight = null;
            });
            if (!act) {
                it.classList.add('active');
                ans.style.maxHeight = ans.scrollHeight + 'px';
            }
        });
    });

    // Scroll reveal animation
    const revealEls = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});
