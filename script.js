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
    mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => mobileMenu.classList.remove('open'));
    });

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
    document.getElementById('fPrev').addEventListener('click', () => { switchFeature(fIdx > 0 ? fIdx - 1 : fContents.length - 1); });
    document.getElementById('fNext').addEventListener('click', () => { switchFeature(fIdx < fContents.length - 1 ? fIdx + 1 : 0); });

    // Pricing toggle (month/year)
    document.querySelectorAll('.pricing-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pricing-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const p = btn.dataset.period;
            document.querySelectorAll('.plan-price').forEach(el => {
                if(el.dataset[p] !== undefined) el.childNodes[0].textContent = el.dataset[p] + ' ';
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

    // AI Chat question click interaction
    document.querySelectorAll('.ai-chat-question').forEach(q => {
        q.addEventListener('click', () => {
            document.querySelectorAll('.ai-chat-question').forEach(c => c.classList.remove('active'));
            q.classList.add('active');
            document.querySelectorAll('.ai-answer-card').forEach(c => {
                c.style.animation = 'none';
                c.offsetHeight;
                c.style.animation = '';
            });
        });
    });

    // Roadmap tabs - smooth continuous progress
    const rmTabs=document.querySelectorAll('.rm-step-tab');
    const rmContents=document.querySelectorAll('.rm-step-content');
    const rmFill=document.querySelector('.rm-progress-fill');
    const rmStopPoints=[12.5,37.5,62.5,100];
    let rmIdx=0, rmAutoI, rmMicroI, rmCurrentWidth=0;

    function switchRM(i, animate){
        rmContents.forEach(c=>{c.style.opacity='0';c.style.transform='translateY(20px)';});
        rmTabs.forEach(t=>t.classList.remove('active'));
        rmTabs[i].classList.add('active');
        const targetW=rmStopPoints[i];
        if(animate!==false){animateProgress(rmCurrentWidth,targetW,800);}
        else{if(rmFill)rmFill.style.width=targetW+'%';rmCurrentWidth=targetW;}
        setTimeout(()=>{
            rmContents.forEach(c=>c.classList.remove('active'));
            const el=document.getElementById(rmTabs[i].dataset.step);
            if(el){el.classList.add('active');requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateY(0)';});}
        },animate!==false?200:0);
        rmIdx=i;
    }
    function animateProgress(from,to,duration){
        const start=performance.now(),diff=to-from;
        function frame(time){
            const elapsed=time-start,progress=Math.min(elapsed/duration,1);
            const eased=1-Math.pow(1-progress,3);
            const current=from+diff*eased;
            if(rmFill)rmFill.style.width=current+'%';
            rmCurrentWidth=current;
            if(progress<1)requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
    }
    function startMicroProgress(){
        clearInterval(rmMicroI);
        const fromW=rmStopPoints[rmIdx];
        const segmentEnd=rmIdx<3?rmStopPoints[rmIdx+1]:100;
        let microW=fromW;
        const stepSize=(segmentEnd-fromW)/120;
        rmMicroI=setInterval(()=>{
            microW+=stepSize;
            if(microW>=segmentEnd){microW=segmentEnd;clearInterval(rmMicroI);}
            if(rmFill)rmFill.style.width=microW+'%';
            rmCurrentWidth=microW;
        },50);
    }
    if(rmTabs.length>0){
        rmTabs.forEach((t,i)=>{t.addEventListener('click',()=>{
            clearInterval(rmAutoI);clearInterval(rmMicroI);
            switchRM(i);setTimeout(startMicroProgress,900);rmAutoR();
        })});
        function rmAutoR(){
            clearInterval(rmAutoI);
            setTimeout(startMicroProgress,500);
            rmAutoI=setInterval(()=>{
                clearInterval(rmMicroI);
                rmIdx=(rmIdx+1)%rmTabs.length;
                if(rmIdx===0){animateProgress(rmCurrentWidth,0,400);setTimeout(()=>{switchRM(0);setTimeout(startMicroProgress,900);},500);}
                else{switchRM(rmIdx);setTimeout(startMicroProgress,900);}
            },6000);
        }
        rmAutoR();
        rmContents.forEach(c=>{c.style.transition='opacity 0.4s ease, transform 0.4s ease';});
    }

    // Scroll reveal animation (IntersectionObserver)
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
