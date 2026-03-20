  function toggleCard(headerEl) {
    const card = headerEl.closest('.section-card');
    const isExpanded = card.classList.contains('expanded');

    document.querySelectorAll('.section-card').forEach(c => {
      const h = c.querySelector('.card-header');
      const ch = c.querySelector('.chevron');
      c.classList.remove('expanded');
      c.classList.add('collapsed');
      h.classList.remove('expanded');
      h.classList.add('collapsed');
      ch.classList.remove('up');
    });

    if (!isExpanded) {
      const chevron = headerEl.querySelector('.chevron');
      card.classList.remove('collapsed');
      card.classList.add('expanded');
      headerEl.classList.remove('collapsed');
      headerEl.classList.add('expanded');
      chevron.classList.add('up');
    }
  }

  let voiceLottie = null;

  const sentences = [
    '쓰다듬어진 듯한 완만함과\n깎아놓은 듯한 뾰족함이 어우러진\n산등성이를 따라 오르다 보면\n절로 감탄을 금할 수가 없게 된다.',
    '고요한 새벽 공기 속에서\n풀잎 위의 이슬방울이\n아침 햇살을 받아 빛나고 있었다.',
    '오랜 시간 걸어온 길 위에서\n잠시 멈추어 뒤를 돌아보니\n지나온 발자국들이 고스란히 남아 있었다.',
    '파란 하늘 아래 펼쳐진 들판에\n바람이 살며시 불어와\n황금빛 벼들이 물결처럼 일렁였다.',
  ];

  let isRecording = false;
  let currentSentence = 0;
  let countdownTimer = null;
  let fillTimer = null;
  let canStop = false;

  function showVoiceRecord() {
    setMeasuring(true);
    history.pushState({ measuring: true }, '');
    document.getElementById('ai-view-voice').style.display = 'none';
    const recordView = document.getElementById('ai-view-record');
    recordView.style.display = 'flex';
    currentSentence = 0;
    resetToIdle();
    updateSentenceText();
    window.scrollTo(0, 0);
  }

  function backToVoiceGuide() {
    clearAllTimers();
    resetToIdle();
    document.getElementById('ai-view-record').style.display = 'none';
    document.getElementById('ai-view-voice').style.display = 'flex';
    window.scrollTo(0, 0);
  }

  function handleMicBtn() {
    if (!isRecording && !countdownTimer) {
      startCountdown();
    } else if (isRecording && canStop) {
      finishCurrentSentence();
    }
  }

  function startCountdown() {
    let count = 3;
    const overlay = document.getElementById('voice-countdown-overlay');
    const numEl = document.getElementById('voice-countdown-num');
    const waveform = document.getElementById('voice-waveform');
    const label = document.getElementById('voice-guide-label');

    setMicBtnState('counting');

    waveform.style.visibility = 'hidden';
    overlay.classList.add('active');
    numEl.textContent = count;
    label.innerHTML = `${count}초 후, 녹음이 시작됩니다.`;

    countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = 'countPop 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        numEl.textContent = count;
        label.innerHTML = `${count}초 후, 녹음이 시작됩니다.`;
      } else {
        clearInterval(countdownTimer);
        countdownTimer = null;
        overlay.classList.remove('active');
        waveform.style.visibility = 'visible';
        beginRecording();
      }
    }, 1000);
  }

  function beginRecording() {
    isRecording = true;
    canStop = false;

    document.getElementById('voice-waveform').classList.add('recording');
    document.getElementById('voice-guide-label').innerHTML =
      '문장을 모두 읽었다면,<br>녹음 마치기 버튼을 눌러주세요.';

    document.getElementById('voice-sentence-base').style.display = 'none';
    const fillEl = document.getElementById('voice-sentence-fill');
    fillEl.style.display = 'block';

    setMicBtnState('stop-inactive');
    startCharFill(fillEl);
  }

  function startCharFill(fillEl) {
    const chars = fillEl.querySelectorAll('.char');
    const total = chars.length;
    if (total === 0) return;

    const interval = 160;
    chars.forEach((ch, i) => {
      setTimeout(() => {
        ch.classList.add('lit');
        if (i === total - 1) {
          setTimeout(() => {
            canStop = true;
            setMicBtnState('stop-active');
          }, 400);
        }
      }, i * interval);
    });
  }

  function resetToIdle() {
    const waveform = document.getElementById('voice-waveform');
    document.getElementById('voice-sentence-base').style.display = 'block';
    document.getElementById('voice-sentence-fill').style.display = 'none';
    waveform.style.visibility = 'visible';
    setMicBtnState('mic');
    waveform.classList.remove('recording');
    document.getElementById('voice-countdown-overlay').classList.remove('active');
  }

  function updateSentenceText() {
    const raw = sentences[currentSentence];
    document.getElementById('voice-sentence-base').innerHTML = raw.replace(/\n/g, '<br>');

    const fillEl = document.getElementById('voice-sentence-fill');
    fillEl.innerHTML = raw.split('').map(ch => {
      if (ch === '\n') return '<br>';
      return `<span class="char">${ch}</span>`;
    }).join('');

    document.getElementById('voice-page-indicator').textContent =
      `${currentSentence + 1} / ${sentences.length}`;

    if (currentSentence > 0) {
      document.getElementById('voice-guide-label').innerHTML =
        '녹음하기 버튼을 누른 후,<br>아래 문장을 따라 읽어주세요.';
    }
  }

  function clearAllTimers() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (fillTimer) { clearTimeout(fillTimer); fillTimer = null; }
    document.getElementById('voice-countdown-overlay').classList.remove('active');
    const waveform = document.getElementById('voice-waveform');
    if (waveform) waveform.style.visibility = 'visible';
  }

  function setMicBtnState(state) {
    const btn = document.getElementById('voice-mic-btn');
    const micIcon = document.getElementById('voice-icon-mic');
    const stopIcon = document.getElementById('voice-icon-stop');
    if (!btn) return;

    btn.classList.remove('stop-inactive', 'stop-active');
    btn.style.background = '';
    btn.style.boxShadow = '';
    btn.style.opacity = '';
    btn.disabled = false;
    micIcon.style.display = 'block';
    stopIcon.style.display = 'none';

    if (state === 'counting') {
      btn.style.background = 'linear-gradient(160deg, #aaa 0%, #888 100%)';
      btn.style.boxShadow = '0 0 0 10px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.1)';
      btn.disabled = true;
    } else if (state === 'stop-inactive') {
      micIcon.style.display = 'none';
      stopIcon.style.display = 'block';
      btn.classList.add('stop-inactive');
      btn.disabled = true;
    } else if (state === 'stop-active') {
      micIcon.style.display = 'none';
      stopIcon.style.display = 'block';
      btn.classList.add('stop-active');
    }
  }

  function finishCurrentSentence() {
    clearAllTimers();
    isRecording = false;
    canStop = false;
    document.getElementById('voice-waveform').classList.remove('recording');

    if (currentSentence < sentences.length - 1) {
      currentSentence++;
      updateSentenceText();
      document.getElementById('voice-guide-label').innerHTML =
        '녹음하기 버튼을 누른 후,<br>아래 문장을 따라 읽어주세요.';
      resetToIdle();
    } else {
      resetToIdle();
      setTimeout(() => showFaceGuide(), 400);
    }
  }

  function stopRecording() {
    clearAllTimers();
    isRecording = false;
    canStop = false;
    const waveform = document.getElementById('voice-waveform');
    if (waveform) { waveform.classList.remove('recording'); waveform.style.visibility = 'visible'; }
    resetToIdle();
  }

  let faceLottie = null;

  let faceStream = null;
  let faceLandmarker = null;
  let faceDetectionLoop = null;
  let faceDetected = false;
  let faceMeasuring = false;

  function updateDimClip() {
    const dimEl   = document.getElementById('face-frame-dim');
    const frameEl = document.getElementById('face-frame');
    const wrapEl  = document.querySelector('.face-camera-wrap');
    if (!dimEl || !frameEl || !wrapEl) return;

    const wrapRect  = wrapEl.getBoundingClientRect();
    const frameRect = frameEl.getBoundingClientRect();

    const left   = Math.round(frameRect.left   - wrapRect.left);
    const top    = Math.round(frameRect.top    - wrapRect.top);
    const right  = Math.round(wrapRect.right   - frameRect.right);
    const bottom = Math.round(wrapRect.bottom  - frameRect.bottom);
    const fH     = Math.round(frameRect.height);

    const color  = 'rgba(0,0,0,0.50)';

    dimEl.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;height:${top}px;background:${color};"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:${bottom}px;background:${color};"></div>
      <div style="position:absolute;top:${top}px;left:0;width:${left}px;height:${fH}px;background:${color};"></div>
      <div style="position:absolute;top:${top}px;right:0;width:${right}px;height:${fH}px;background:${color};"></div>
    `;
  }

  async function startFaceRecord() {
    document.getElementById('ai-view-face').style.display = 'none';
    document.getElementById('ai-view-face-record').style.display = 'flex';

    document.querySelector('.phone').classList.add('face-fullscreen');
    window.scrollTo(0, 0);

    faceDetected = false;
    const startBtn = document.getElementById('face-start-btn');
    const bottomLabel = document.getElementById('face-bottom-label');
    document.getElementById('face-loading-overlay').style.display = 'flex';
    document.getElementById('face-frame-overlay').style.display = 'none';
    document.getElementById('face-frame-dim').style.display = 'none';
    document.getElementById('face-error-overlay').style.display = 'none';
    document.getElementById('face-camera-feed').style.display = 'none';
    startBtn.classList.add('face-inactive');
    startBtn.disabled = false;
    startBtn.style.opacity = '';
    document.getElementById('face-frame').classList.remove('detected');
    bottomLabel.textContent = '얼굴을 프레임 안에 맞춰주세요';
    bottomLabel.style.color = '';
    document.getElementById('face-bottom-sub').textContent = '하단 시작하기 버튼을 눌러주세요.';

    try {
      faceStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      const video = document.getElementById('face-camera-feed');
      video.srcObject = faceStream;
      video.onloadedmetadata = async () => {
        document.getElementById('face-loading-overlay').style.display = 'none';
        video.style.display = 'block';
        document.getElementById('face-frame-dim').style.display = 'block';
        document.getElementById('face-frame-overlay').style.display = 'flex';
        requestAnimationFrame(() => updateDimClip());
        await initFaceDetection(video);
      };
    } catch (err) {
      document.getElementById('face-loading-overlay').style.display = 'none';
      const errOverlay = document.getElementById('face-error-overlay');
      const errText = errOverlay.querySelector('.face-error-text');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errText.innerHTML = '카메라 권한이 차단되어 있어요.<br>주소창 왼쪽 자물쇠 아이콘을 눌러<br>카메라 권한을 허용한 후 새로고침해 주세요.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errText.innerHTML = '카메라를 찾을 수 없어요.<br>카메라가 연결되어 있는지 확인해 주세요.';
      } else {
        errText.innerHTML = `카메라를 사용할 수 없어요.<br>브라우저 설정에서 카메라 권한을 허용해 주세요.<br><small style="opacity:0.6">(${err.name})</small>`;
      }
      errOverlay.style.display = 'flex';
    }
  }

  async function initFaceDetection(video) {
    let attempts = 0;
    while (!window._FaceLandmarker && attempts < 30) {
      await new Promise(r => setTimeout(r, 200));
      attempts++;
    }

    if (!window._FaceLandmarker) {
      setTimeout(() => triggerFaceDetected(), 3000);
      return;
    }

    try {
      const vision = await window._FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );
      faceLandmarker = await window._FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });
      runFaceLandmarkerLoop(video);
    } catch (e) {
      setTimeout(() => triggerFaceDetected(), 3000);
    }
  }

  function syncCanvasSize() {
    const canvas = document.getElementById('face-landmark-canvas');
    const video = document.getElementById('face-camera-feed');
    if (!canvas || !video) return;
    canvas.width  = video.videoWidth  || video.clientWidth;
    canvas.height = video.videoHeight || video.clientHeight;
    canvas.style.width  = '100%';
    canvas.style.height = '100%';
  }

  function drawLandmarks(ctx, landmarks, w, h) {
    ctx.clearRect(0, 0, w, h);

    const t = performance.now() / 1000;
    const pulse = 0.65 + 0.35 * Math.sin(t * Math.PI * 1.25);

    const conns = (window._FaceLandmarker && window._FaceLandmarker.FACE_LANDMARKS_TESSELATION) || [];
    ctx.strokeStyle = `rgba(255,255,255,${0.18 * pulse})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (const { start, end } of conns) {
      const s = landmarks[start];
      const e = landmarks[end];
      if (!s || !e) continue;
      ctx.moveTo(s.x * w, s.y * h);
      ctx.lineTo(e.x * w, e.y * h);
    }
    ctx.stroke();

    const contour = (window._FaceLandmarker && window._FaceLandmarker.FACE_LANDMARKS_FACE_OVAL) || [];
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * pulse})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < contour.length; i++) {
      const { start, end } = contour[i];
      const s = landmarks[start];
      const e = landmarks[end];
      if (!s || !e) continue;
      ctx.moveTo(s.x * w, s.y * h);
      ctx.lineTo(e.x * w, e.y * h);
    }
    ctx.stroke();

    const keyPoints = new Set([1, 4, 5, 6, 195, 197, 0, 17, 61, 291, 78, 308, 33, 263, 133, 362]);
    const total = landmarks.length;
    for (let i = 0; i < total; i++) {
      const lm = landmarks[i];
      const phase = (i / total) * Math.PI * 4;
      const wave = 0.5 + 0.5 * Math.sin(t * Math.PI * 1.5 - phase);
      const opacity = 0.3 + 0.7 * wave;
      const radius = keyPoints.has(i) ? 1.8 : 0.9;
      ctx.fillStyle = `rgba(255,255,255,${opacity})`;
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function runFaceLandmarkerLoop(video) {
    const frameEl   = document.getElementById('face-frame');
    const canvas    = document.getElementById('face-landmark-canvas');
    const ctx       = canvas.getContext('2d');

    function detect() {
      if (!faceLandmarker || !video || video.readyState < 2) {
        faceDetectionLoop = requestAnimationFrame(detect);
        return;
      }

      syncCanvasSize();
      const w = canvas.width;
      const h = canvas.height;

      const results = faceLandmarker.detectForVideo(video, performance.now());
      const hasLandmarks = results.faceLandmarks && results.faceLandmarks.length > 0;

      if (hasLandmarks) {
        if (canvas.classList.contains('visible')) {
          drawLandmarks(ctx, results.faceLandmarks[0], w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }

        const lms = results.faceLandmarks[0];
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        for (const lm of lms) {
          if (lm.x < minX) minX = lm.x;
          if (lm.x > maxX) maxX = lm.x;
          if (lm.y < minY) minY = lm.y;
          if (lm.y > maxY) maxY = lm.y;
        }
        const fw = maxX - minX;
        const faceCx = (minX + maxX) / 2;
        const faceCy = (minY + maxY) / 2;

        const frameW = 0.65;
        const frameH = frameW * (4 / 3);
        const frameX = (1 - frameW) / 2;
        const frameY = (1 - frameH) / 2;

        const inFrame =
          faceCx > frameX && faceCx < frameX + frameW &&
          faceCy > frameY && faceCy < frameY + frameH &&
          fw > frameW * 0.35;

        if (inFrame && !faceDetected) {
          triggerFaceDetected();
        } else if (!inFrame && faceDetected && !faceMeasuring) {
          faceDetected = false;
          frameEl.classList.remove('detected');
          document.getElementById('face-start-btn').classList.add('face-inactive');
          document.getElementById('face-bottom-label').textContent = '얼굴을 프레임 안에 맞춰주세요';
        }

        if (faceMeasuring) {
          if (!inFrame) setFaceLost(true);
          else setFaceLost(false);
        }
      } else {
        ctx.clearRect(0, 0, w, h);
        if (faceDetected && !faceMeasuring) {
          faceDetected = false;
          frameEl.classList.remove('detected');
          document.getElementById('face-start-btn').classList.add('face-inactive');
          document.getElementById('face-bottom-label').textContent = '얼굴을 프레임 안에 맞춰주세요';
        }
        if (faceMeasuring) setFaceLost(true);
      }

      faceDetectionLoop = requestAnimationFrame(detect);
    }

    faceDetectionLoop = requestAnimationFrame(detect);
  }

  function triggerFaceDetected() {
    if (faceDetected) return;
    faceDetected = true;
    document.getElementById('face-frame').classList.add('detected');
    document.getElementById('face-start-btn').classList.remove('face-inactive');
    document.getElementById('face-bottom-label').textContent = '얼굴이 인식되었어요!';
  }

  let faceLostState = false;
  function setFaceLost(lost) {
    if (faceLostState === lost) return;
    faceLostState = lost;
    document.getElementById('face-lost-toast').classList.toggle('active', lost);
    document.getElementById('face-frame').classList.toggle('face-lost', lost);
    document.getElementById('face-measure-progress-wrap').classList.toggle('face-lost', lost);
    const label = document.getElementById('face-bottom-label');
    const sub   = document.getElementById('face-bottom-sub');
    if (lost) {
      label.textContent = '얼굴을 프레임 안에 맞춘 후';
      label.style.color = '';
      sub.textContent   = '다시 화면을 바라봐주세요.';
    } else {
      label.textContent = '잘 측정되고 있어요!';
      label.style.color = '#2F6C46';
      sub.textContent   = '지금처럼 화면을 계속 바라보세요.';
    }
  }

  let faceCountdownTimer = null;

  function confirmFaceDetected() {
    if (faceCountdownTimer) return;
    const startBtn = document.getElementById('face-start-btn');
    const bottomLabel = document.getElementById('face-bottom-label');
    startBtn.disabled = true;
    startBtn.style.opacity = '0.5';
    bottomLabel.textContent = '측정이 곧 시작됩니다';
    bottomLabel.style.color = '#2f6c46';
    startFaceCountdown();
  }

  function startFaceCountdown() {
    let count = 3;
    const overlay = document.getElementById('face-countdown-overlay');
    const numEl   = document.getElementById('face-countdown-num');
    const bottomLabel = document.getElementById('face-bottom-label');

    overlay.classList.add('active');
    numEl.textContent = count;
    bottomLabel.textContent = `${count}초 후 측정이 시작됩니다`;
    bottomLabel.style.color = '#2f6c46';

    faceCountdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = 'faceCountPop 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        numEl.textContent = count;
        bottomLabel.textContent = `${count}초 후 측정이 시작됩니다`;

        if (count === 2) {
          const canvas = document.getElementById('face-landmark-canvas');
          if (canvas) canvas.classList.add('visible');
        }
      } else {
        clearInterval(faceCountdownTimer);
        faceCountdownTimer = null;
        overlay.classList.remove('active');
        bottomLabel.textContent = '잘 측정되고 있어요!';
        document.getElementById('face-bottom-sub').textContent = '지금처럼 화면을 계속 바라보세요.';
        startFaceMeasureTimer();
      }
    }, 1000);
  }

  let faceMeasureTimer  = null;
  const FACE_MEASURE_TOTAL = 30;

  function startFaceMeasureTimer() {
    faceMeasuring = true;

    const timerEl      = document.getElementById('face-measure-timer');
    const progressWrap = document.getElementById('face-measure-progress-wrap');
    const pctEl        = document.getElementById('face-measure-progress-pct');
    const fillEl       = document.getElementById('face-measure-progress-fill');

    timerEl.classList.add('active');
    progressWrap.classList.add('active');

    function formatTime(sec) {
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      return `${m}:${s}`;
    }

    timerEl.textContent = formatTime(FACE_MEASURE_TOTAL);
    pctEl.textContent   = '0%';
    fillEl.style.width  = '0%';

    let activeElapsed = 0;
    let lastTs = null;
    let shownAlmost = false;

    function tick(ts) {
      if (!faceMeasuring) return;
      if (lastTs !== null && !faceLostState) {
        activeElapsed = Math.min(activeElapsed + (ts - lastTs) / 1000, FACE_MEASURE_TOTAL);
      }
      lastTs = ts;

      const pct = (activeElapsed / FACE_MEASURE_TOTAL) * 100;
      const remaining = FACE_MEASURE_TOTAL - activeElapsed;
      timerEl.textContent = formatTime(Math.ceil(remaining));
      pctEl.textContent   = `${Math.floor(pct)}%`;
      fillEl.style.width  = `${pct}%`;

      if (pct >= 80 && !shownAlmost) {
        shownAlmost = true;
        const bottomLabel = document.getElementById('face-bottom-label');
        bottomLabel.textContent = '거의 다 됐어요!';
        bottomLabel.style.color = '#2F6C46';
        document.getElementById('face-bottom-sub').textContent = '잠시만 더 화면을 응시해주세요.';
      }

      if (activeElapsed >= FACE_MEASURE_TOTAL) {
        faceMeasureTimer = null;
        faceMeasuring = false;
        onFaceMeasureComplete();
        return;
      }
      faceMeasureTimer = requestAnimationFrame(tick);
    }
    faceMeasureTimer = requestAnimationFrame(tick);
  }

  function onFaceMeasureComplete() {
    setFaceLost(false);
    faceLostState = false;
    document.getElementById('face-measure-timer').classList.remove('active');
    document.getElementById('face-measure-progress-wrap').classList.remove('active');
    const canvas = document.getElementById('face-landmark-canvas');
    if (canvas) canvas.classList.remove('visible');
    showAnalyzingScreen();
  }

  function showAnalyzingScreen() {
    if (faceDetectionLoop) { cancelAnimationFrame(faceDetectionLoop); faceDetectionLoop = null; }
    if (faceStream) { faceStream.getTracks().forEach(t => t.stop()); faceStream = null; }
    const video = document.getElementById('face-camera-feed');
    if (video) video.srcObject = null;

    const overlay = document.getElementById('analyzing-overlay');
    const pctEl   = document.getElementById('analyzing-pct');
    const canvas  = document.getElementById('analyzing-canvas');
    overlay.classList.add('active');

    const target  = 92;
    const countDuration = 4000;
    const startTs  = performance.now();

    function updateCount(ts) {
      const progress = Math.min((ts - startTs) / countDuration, 1);
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      pctEl.textContent = Math.round(eased * target) + '%';
      if (progress < 1) requestAnimationFrame(updateCount);
    }
    requestAnimationFrame(updateCount);

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const cx = size / 2, cy = size / 2;
    const R  = size * 0.44;
    let dotAnimFrame;
    let dotStart = null;

    function drawAI(ts) {
      if (!dotStart) dotStart = ts;
      const t = (ts - dotStart) / 1000;
      ctx.clearRect(0, 0, size, size);

      [0.32, 0.58, 0.84].forEach(scale => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * scale, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(47,108,70,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      const arcs = [
        { r: 0.84, speed:  0.22, sweep: 2.2, lw: 3.0, alpha: 0.45 },
        { r: 0.58, speed: -0.31, sweep: 1.6, lw: 2.2, alpha: 0.35 },
        { r: 0.32, speed:  0.50, sweep: 1.9, lw: 1.5, alpha: 0.25 },
      ];
      arcs.forEach(({ r, speed, sweep, lw, alpha }) => {
        const a = t * speed * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R * r, a, a + sweep);
        ctx.strokeStyle = `rgba(47,108,70,${alpha})`;
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      const RING_INTERVAL = 1.6, RING_DURATION = 2.8;
      for (let i = 0; i < 5; i++) {
        const age = t - i * RING_INTERVAL;
        if (age <= 0 || age > RING_DURATION) continue;
        const p = age / RING_DURATION;
        ctx.beginPath();
        ctx.arc(cx, cy, R * (0.05 + 0.92 * p), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(47,108,70,${Math.pow(1 - p, 1.8) * 0.2})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const b = 0.5 + 0.5 * Math.sin(t * 1.8);
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.28);
      gr.addColorStop(0, `rgba(47,108,70,${0.18 + 0.10 * b})`);
      gr.addColorStop(1, 'rgba(47,108,70,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.28, 0, Math.PI * 2);
      ctx.fill();

      dotAnimFrame = requestAnimationFrame(drawAI);
    }
    dotAnimFrame = requestAnimationFrame(drawAI);

    setTimeout(() => {
      cancelAnimationFrame(dotAnimFrame);
      overlay.classList.remove('active');
      showResultScreen();
    }, 4500);
  }

  function showResultScreen() {
    const overlay = document.getElementById('result-overlay');
    overlay.classList.add('active');
    window.scrollTo(0, 0);

    document.querySelector('.phone').classList.remove('face-fullscreen');

    const now = new Date();
    const days = ['일','월','화','수','목','금','토'];
    document.getElementById('result-date').textContent =
      `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}(${days[now.getDay()]})`;

    const SCORE = 75;
    const duration = 1500;
    const MAX_DASH = 547;

    const arc = document.getElementById('result-gauge-fill-arc');
    arc.style.transition = 'none';
    arc.style.strokeDashoffset = MAX_DASH;

    let gaugeStart = null;
    const targetOffset = MAX_DASH * (1 - SCORE / 100);

    function drawGauge(ts) {
      if (!gaugeStart) gaugeStart = ts;
      const elapsed = ts - gaugeStart;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      arc.style.strokeDashoffset = MAX_DASH - eased * (MAX_DASH - targetOffset);
      document.getElementById('result-score-num').textContent = Math.round(eased * SCORE);

      if (t < 1) {
        requestAnimationFrame(drawGauge);
      } else {
        setTimeout(() => animateBar('metric-fill-stress',    35), 0);
        setTimeout(() => animateBar('metric-fill-anxiety',   65), 250);
        setTimeout(() => animateBar('metric-fill-depression',70), 500);
      }
    }
    requestAnimationFrame(() => requestAnimationFrame(drawGauge));
  }

  function animateBar(id, pct) {
    document.getElementById(id).style.width = pct + '%';
  }

  function stopFaceDetection() {
    if (faceDetectionLoop) { cancelAnimationFrame(faceDetectionLoop); faceDetectionLoop = null; }
    if (faceLandmarker) { faceLandmarker.close(); faceLandmarker = null; }
    if (faceCountdownTimer) { clearInterval(faceCountdownTimer); faceCountdownTimer = null; }
    if (faceMeasureTimer)   { cancelAnimationFrame(faceMeasureTimer); faceMeasureTimer = null; }
    document.getElementById('face-countdown-overlay')?.classList.remove('active');
    document.getElementById('face-measure-timer')?.classList.remove('active');
    document.getElementById('face-measure-progress-wrap')?.classList.remove('active');
    const canvas = document.getElementById('face-landmark-canvas');
    if (canvas) { canvas.classList.remove('visible'); }
    document.querySelector('.phone').classList.remove('face-fullscreen');
    faceDetected = false;
    faceMeasuring = false;
  }

  function showFaceGuide() {
    document.getElementById('ai-view-record').style.display = 'none';
    const faceView = document.getElementById('ai-view-face');
    faceView.style.display = 'flex';
    window.scrollTo(0, 0);

    if (!faceLottie) {
      fetch('https://jayohhh123.github.io/kossresults/videoNotice.json')
        .then(r => r.json())
        .then(data => {
          faceLottie = lottie.loadAnimation({
            container: document.getElementById('face-lottie'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: data,
          });
        });
    }
  }

  function showVoiceGuide() {
    document.getElementById('ai-view-guide').style.display = 'none';
    const voiceView = document.getElementById('ai-view-voice');
    voiceView.style.display = 'flex';
    window.scrollTo(0, 0);

    if (!voiceLottie) {
      fetch('https://jayohhh123.github.io/kossresults/voiceAnimation.json')
        .then(r => r.json())
        .then(data => {
          voiceLottie = lottie.loadAnimation({
            container: document.getElementById('voice-lottie'),
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: data,
          });
        });
    }
  }

  // ── 측정 중 상태 플래그 ─────────────────────
  let isMeasuring = false;
  let pendingTabIndex = null;
  let pendingAction = null;

  function setMeasuring(val) { isMeasuring = val; }

  function showExitModal(action, tabIndex) {
    pendingAction = action;
    pendingTabIndex = tabIndex ?? null;
    document.getElementById('measure-exit-dim').classList.add('active');
  }

  function closeExitModal() {
    document.getElementById('measure-exit-dim').classList.remove('active');
    pendingAction = null;
    pendingTabIndex = null;
    history.pushState({ measuring: true }, '');
  }

  function confirmExit() {
    document.getElementById('measure-exit-dim').classList.remove('active');
    isMeasuring = false;
    if (faceStream) { faceStream.getTracks().forEach(t => t.stop()); faceStream = null; }
    clearAllTimers();
    stopRecording();
    if (voiceLottie) { voiceLottie.stop(); voiceLottie = null; }
    if (faceLottie) { faceLottie.stop(); faceLottie = null; }
    document.querySelector('.phone').classList.remove('face-fullscreen');

    if (pendingAction === 'tab' && pendingTabIndex !== null) {
      _switchNavTabDirect(pendingTabIndex);
    } else {
      ['ai-view-guide','ai-view-voice','ai-view-record','ai-view-face','ai-view-face-record'].forEach(id => {
        document.getElementById(id).style.display = 'none';
      });
      document.getElementById('ai-view-gauge').style.display = 'flex';
      const arc = document.getElementById('gauge-fill-arc');
      if (arc) {
        arc.style.transition = 'none';
        arc.style.strokeDashoffset = '437';
        requestAnimationFrame(() => requestAnimationFrame(() => {
          arc.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)';
          arc.style.strokeDashoffset = '0';
        }));
      }
    }
    pendingAction = null;
    pendingTabIndex = null;
  }

  window.addEventListener('popstate', () => {
    if (isMeasuring) {
      history.pushState({ measuring: true }, '');
      showExitModal('back');
    }
  });

  function showAiGuide() {
    document.getElementById('ai-view-gauge').style.display = 'none';
    const guide = document.getElementById('ai-view-guide');
    guide.style.display = 'flex';
    window.scrollTo(0, 0);
  }

  function switchNavTab(index) {
    if (isMeasuring) {
      showExitModal('tab', index);
      return;
    }
    _switchNavTabDirect(index);
  }

  function _switchNavTabDirect(index) {
    document.getElementById('result-overlay').classList.remove('active');
    document.getElementById('analyzing-overlay').classList.remove('active');

    document.querySelectorAll('.nav-tab').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.nav-pane').forEach((p, i) => {
      p.style.display = i === index ? '' : 'none';
    });
    window.scrollTo(0, 0);

    if (index === 2) {
      const aiViews = ['ai-view-guide','ai-view-voice','ai-view-record','ai-view-face','ai-view-face-record'];
      aiViews.forEach(id => { document.getElementById(id).style.display = 'none'; });
      document.getElementById('ai-view-gauge').style.display = 'flex';
      if (faceStream) { faceStream.getTracks().forEach(t => t.stop()); faceStream = null; }
      if (typeof stopFaceDetection === 'function') stopFaceDetection();
      document.querySelector('.phone').classList.remove('face-fullscreen');
      if (typeof clearAllTimers === 'function') clearAllTimers();
      if (typeof stopRecording === 'function') stopRecording();
      if (voiceLottie) { voiceLottie.stop(); voiceLottie = null; }
      if (faceLottie) { faceLottie.stop(); faceLottie = null; }
      const arc = document.getElementById('gauge-fill-arc');
      if (arc) {
        arc.style.transition = 'none';
        arc.style.strokeDashoffset = '437';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            arc.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)';
            arc.style.strokeDashoffset = '0';
          });
        });
      }
    }
  }

  function switchTab(tabEl, tabId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
    document.getElementById('tab-work').style.display  = tabId === 'work'  ? 'flex' : 'none';
    document.getElementById('tab-daily').style.display = tabId === 'daily' ? 'flex' : 'none';
  }

  // ── 정서 상태 탭 데이터 & 렌더링 ──────────────────

  // ★ 백엔드 연동 시 이 두 값과 q9Flag만 교체
  const DEPRESSION_SCORE = 25;
  const ANXIETY_SCORE    = 11;
  const Q9_FLAG          = true;

  const depressionLevels = [
    {
      range: [0, 4],
      label: '우울 아님', emoji: '😊',
      badgeColor: '#179229',
      heroBg: '#f0faf4',
      summaryBold: '우울 아님 수준입니다.',
      body: '검사 결과, 현재 의미 있는 수준의 우울감은 나타나지 않습니다. 최근 2주 동안의 정서 상태는 비교적 안정적으로 유지되고 있는 것으로 보입니다. 지금의 생활 리듬과 스트레스 관리 방식을 꾸준히 이어가시면 마음 건강에 도움이 될 것입니다.',
      tableRowClass: 'row-safe',
      solutions: [
        { emoji: '🌙', text: '규칙적인 수면·운동·식사 습관을 통해 정서적 안정의 기반을 꾸준히 다져나가기' },
        { emoji: '📔', text: '일상 속 긍정적 경험을 의식적으로 알아차리고 감사 일기 등으로 기록하기' },
      ],
    },
    {
      range: [5, 9],
      label: '경미한 우울', emoji: '😐',
      badgeColor: '#eb9927',
      heroBg: '#fffbef',
      summaryBold: '경미한 우울 수준입니다.',
      body: '검사 결과, 가벼운 수준의 우울감이 나타나고 있습니다. 일시적인 스트레스나 피로로 인해 기분이 다소 가라앉거나 흥미가 줄어드는 경험을 하셨을 수 있습니다. 충분한 휴식과 자기 돌봄을 통해 현재의 정서 상태를 살펴보시길 권해 드립니다.',
      tableRowClass: 'row-caution',
      solutions: [
        { emoji: '🚶', text: '걷기·가벼운 운동 등 신체 활동을 통해 기분 전환 시간을 규칙적으로 확보하기' },
        { emoji: '🤝', text: '신뢰할 수 있는 주변 사람에게 현재 감정을 솔직하게 털어놓고 정서적 지지 구하기' },
      ],
    },
    {
      range: [10, 19],
      label: '위험 수준', emoji: '😔',
      badgeColor: '#fb7500',
      heroBg: '#fff6ee',
      summaryBold: '위험 수준에 해당합니다.',
      body: '검사 결과, 중간 수준의 우울감이 나타나고 있습니다. 최근 2주 동안 기분 저하, 피로, 집중의 어려움 등을 자주 경험하셨을 수 있습니다. 이는 심리적·신체적 대처 능력을 저하시키고 일상생활에 부담을 주기도 합니다. 따라서 전문가와 함께 현재의 정서 상태를 살펴보시기를 권장 드립니다.',
      tableRowClass: 'row-danger',
      solutions: [
        { emoji: '🧑‍⚕️', text: '심리상담 전문가와의 상담을 통해 우울감의 원인과 패턴을 탐색하기' },
        { emoji: '📝', text: '감정 일기를 작성하며 나의 감정 변화를 관찰하고, 필요시 전문기관에 도움 요청하기' },
      ],
    },
    {
      range: [20, 27],
      label: '심각 수준', emoji: '😢',
      badgeColor: '#ea0f0f',
      heroBg: '#fff5f5',
      summaryBold: '심각 수준에 해당합니다.',
      body: '검사 결과, 심한 수준의 우울감이 나타나고 있습니다. 지속적인 우울감, 흥미 감소, 피로, 자책감 등으로 일상에 상당한 어려움이 예상됩니다. 현재 정서 상태에 대한 전문적인 평가와 치료적 지원이 필요하니, 가능한 빠른 시일 내에 전문가의 도움을 받으시길 강력히 권고 드립니다.',
      tableRowClass: 'row-severe',
      solutions: [
        { emoji: '🏥', text: '정신건강의학과 또는 심리상담 전문기관을 방문하여 정확한 평가와 치료 계획 세우기' },
        { emoji: '📞', text: '위기 상황에서는 자살예방상담전화 109 / 생명의 전화 1588-9191 (24시간)에 빠르게 도움 구하기' },
      ],
    },
  ];

  const depressionTableRows = [
    { range: '0–4점', level: '우울 아님',          desc: '현재 유의한 수준의 우울감은 나타나지 않습니다.' },
    { range: '5–9점', level: '경미한 우울',         desc: '일상생활에 큰 지장은 없으나, 감정 변화에 주의를 기울이는 것이 필요합니다.' },
    { range: '10–19점', level: '중간 정도의 우울',  desc: '현재 상태가 일상의 여러 영역에 영향을 줄 수 있으므로 전문가의 도움을 받길 권장합니다.' },
    { range: '20–27점', level: '심한 우울',         desc: '현재 상태가 일상에 상당한 어려움을 줄 수 있으므로, 신속한 전문적 도움이 필요합니다.' },
  ];

  const anxietyLevels = [
    {
      range: [0, 4],
      label: '불안 아님', emoji: '😊',
      badgeColor: '#179229',
      heroBg: '#f0faf4',
      summaryBold: '불안 아님 수준입니다.',
      body: '검사 결과, 현재 유의한 수준의 불안감은 나타나지 않았습니다. 최근 2주 동안 크게 걱정되거나 긴장되는 상황 없이 비교적 편안한 상태를 유지하고 계신 것으로 보입니다. 지금처럼 마음의 여유를 잘 유지해 나가시길 바랍니다.',
      tableRowClass: 'row-safe',
      solutions: [
        { emoji: '🧘', text: '복식호흡이나 가벼운 명상 등 일상에서 꾸준하게 이완 습관 들이기' },
        { emoji: '☕', text: '카페인·과도한 자극 등 불안을 높일 수 있는 요소를 미리 점검하고 관리하기' },
      ],
    },
    {
      range: [5, 9],
      label: '경미한 불안', emoji: '😟',
      badgeColor: '#eb9927',
      heroBg: '#fffbef',
      summaryBold: '경미한 불안 수준입니다.',
      body: '검사 결과, 경미한 수준의 불안감이 나타나고 있습니다. 최근 2주 동안 크고 작은 걱정이 머릿속을 맴돌거나, 특정 상황에서 긴장이 쉽게 풀리지 않는 경험을 하셨을 수 있습니다. 불안감이 더 심해지지 않도록 긴장을 이완할 수 있는 시간을 의식적으로 마련해 보시길 권해 드립니다.',
      tableRowClass: 'row-caution',
      solutions: [
        { emoji: '🍃', text: '걱정이 떠오를 때 그냥 흘려보내는 연습을 함으로써 생각과 거리 두기' },
        { emoji: '🚶', text: '긴장이 느껴질 때 스트레칭, 산책 등 신체 활동으로 긴장감 해소하기' },
      ],
    },
    {
      range: [10, 14],
      label: '위험 수준', emoji: '😰',
      badgeColor: '#fb7500',
      heroBg: '#fff6ee',
      summaryBold: '위험 수준에 해당합니다.',
      body: '검사 결과, 중간 수준의 불안감이 나타나고 있습니다. 최근 2주 동안 걱정을 멈추기 어렵거나, 사소한 일에도 과도하게 긴장되고 안절부절못하는 경험이 자주 있으셨을 수 있습니다. 이러한 불안감은 수면을 방해하거나 신체적 긴장으로 이어지기도 합니다. 혼자 감당하기보다 전문가와 함께 그 원인을 살펴보시는 것을 권장합니다.',
      tableRowClass: 'row-danger',
      solutions: [
        { emoji: '📝', text: '불안이 반복되는 상황과 패턴을 기록하며 나만의 불안 유발 요인 파악하기' },
        { emoji: '🧑‍⚕️', text: '심리상담 전문가를 찾아 불안의 원인과 효과적인 대처 방법을 함께 탐색하기' },
      ],
    },
    {
      range: [15, 21],
      label: '심각 수준', emoji: '😱',
      badgeColor: '#ea0f0f',
      heroBg: '#fff5f5',
      summaryBold: '심각 수준에 해당합니다.',
      body: '검사 결과, 심한 수준의 불안감이 나타나고 있습니다. 최근 2주 동안 불안한 생각이 좀처럼 멈추지 않거나, 심장이 두근거리고 몸이 긴장되는 등 신체 증상이 동반되는 경험을 하셨을 수 있습니다. 이 정도의 불안감은 일상을 지속하는 것 자체를 힘들게 만들 수 있습니다. 지금 많이 지치고 힘드실 수 있으니, 가능한 빠른 시일 내에 전문가의 도움을 받으시길 강력히 권고 드립니다.',
      tableRowClass: 'row-severe',
      solutions: [
        { emoji: '🏥', text: '정신건강의학과 또는 심리상담 전문기관을 방문하여 정확한 평가와 치료 계획 세우기' },
        { emoji: '📞', text: '일상이 너무 힘겹게 느껴진다면 정신건강 위기상담전화(☎ 1577-0199, 24시간)에 즉시 연락하기' },
      ],
    },
  ];

  const anxietyTableRows = [
    { range: '0–4점',   level: '불안 아님',          desc: '현재 유의한 수준의 불안감은 나타나지 않습니다.' },
    { range: '5–9점',   level: '경미한 불안',         desc: '일상생활에 큰 지장은 없으나, 긴장, 걱정이 잦아진다면 주의를 기울이는 것이 필요합니다.' },
    { range: '10–14점', level: '중간 정도의 불안',    desc: '현재 상태가 일상의 여러 영역에 영향을 줄 수 있으므로 전문가의 도움을 받길 권장합니다.' },
    { range: '15–21점', level: '심한 불안',           desc: '현재 상태가 일상에 상당한 어려움을 줄 수 있으므로, 신속한 전문적 도움이 필요합니다.' },
  ];

  function getLevel(score, levels) {
    return levels.find(l => score >= l.range[0] && score <= l.range[1]);
  }

  function renderSolutions(containerId, solutions) {
    const el = document.getElementById(containerId);
    el.innerHTML = solutions.map(s => `
      <div class="solution-item">
        <div class="solution-emoji-box">${s.emoji}</div>
        <span class="solution-text">${s.text}</span>
      </div>`).join('');
  }

  function renderTable(tbodyId, rows, activeRowClass) {
    const el = document.getElementById(tbodyId);
    const rowClasses = ['row-safe', 'row-caution', 'row-danger', 'row-severe'];
    const dotColors = ['#22a855', '#ffbb01', '#ff8820', '#f13232'];
    el.innerHTML = rows.map((r, i) => {
      const cls = rowClasses[i] === activeRowClass ? activeRowClass : '';
      const dot = `<span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:${dotColors[i]}; margin-right:6px; flex-shrink:0; vertical-align:middle; position:relative; top:-1px;"></span>`;
      return `<tr class="${cls}">
        <td>${r.range}</td><td>${dot}${r.level}</td><td>${r.desc}</td>
      </tr>`;
    }).join('');
  }

  function renderEmotionTab() {
    const dLevel = getLevel(DEPRESSION_SCORE, depressionLevels);
    const aLevel = getLevel(ANXIETY_SCORE, anxietyLevels);

    document.getElementById('depression-hero-bg').style.background = dLevel.heroBg;
    document.getElementById('depression-score-display').textContent = DEPRESSION_SCORE + '점';
    const dBadge = document.getElementById('depression-badge');
    dBadge.textContent = dLevel.label;
    dBadge.style.borderColor = dLevel.badgeColor;
    dBadge.style.color = dLevel.badgeColor;
    document.getElementById('depression-emoji').textContent = dLevel.emoji;
    document.getElementById('depression-summary-title').textContent = `홍길동 님의 우울 총점은 ${DEPRESSION_SCORE}점으로,`;
    document.getElementById('depression-summary-bold').textContent = dLevel.summaryBold;
    document.getElementById('depression-body').textContent = dLevel.body;
    renderTable('depression-table-body', depressionTableRows, dLevel.tableRowClass);
    renderSolutions('depression-solutions', dLevel.solutions);
    document.getElementById('depression-crisis-box').style.display = Q9_FLAG ? 'block' : 'none';

    document.getElementById('anxiety-hero-bg').style.background = aLevel.heroBg;
    document.getElementById('anxiety-score-display').textContent = ANXIETY_SCORE + '점';
    const aBadge = document.getElementById('anxiety-badge');
    aBadge.textContent = aLevel.label;
    aBadge.style.borderColor = aLevel.badgeColor;
    aBadge.style.color = aLevel.badgeColor;
    document.getElementById('anxiety-emoji').textContent = aLevel.emoji;
    document.getElementById('anxiety-summary-title').textContent = `홍길동 님의 불안 총점은 ${ANXIETY_SCORE}점으로,`;
    document.getElementById('anxiety-summary-bold').textContent = aLevel.summaryBold;
    document.getElementById('anxiety-body').textContent = aLevel.body;
    renderTable('anxiety-table-body', anxietyTableRows, aLevel.tableRowClass);
    renderSolutions('anxiety-solutions', aLevel.solutions);
  }

  renderEmotionTab();
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target;
        const target = fill.dataset.width;
        requestAnimationFrame(() => {
          fill.style.width = target;
        });
        barObserver.unobserve(fill);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.progress-fill[data-width], .mental-progress-fill[data-width]').forEach(fill => {
    barObserver.observe(fill);
  });
