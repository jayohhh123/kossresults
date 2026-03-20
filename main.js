  function toggleCard(headerEl) {
    const card = headerEl.closest('.section-card');
    const isExpanded = card.classList.contains('expanded');

    // Close all cards first
    document.querySelectorAll('.section-card').forEach(c => {
      const h = c.querySelector('.card-header');
      const ch = c.querySelector('.chevron');
      c.classList.remove('expanded');
      c.classList.add('collapsed');
      h.classList.remove('expanded');
      h.classList.add('collapsed');
      ch.classList.remove('up');
    });

    // If the clicked card was closed, open it
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

    // 파동 숨기고 카운트다운 노출
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
        // 파동 다시 보이기
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

    // 텍스트 전환: base 숨기고 fill 표시
    document.getElementById('voice-sentence-base').style.display = 'none';
    const fillEl = document.getElementById('voice-sentence-fill');
    fillEl.style.display = 'block';

    setMicBtnState('stop-inactive');

    // 글자별 채움
    startCharFill(fillEl);
  }

  function startCharFill(fillEl) {
    const chars = fillEl.querySelectorAll('.char');
    const total = chars.length;
    if (total === 0) return;

    // 글자당 고정 딜레이 160ms
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
    document.getElementById('voice-sentence-base').style.display = 'block';
    document.getElementById('voice-sentence-fill').style.display = 'none';
    document.getElementById('voice-waveform').style.visibility = 'visible';
    setMicBtnState('mic');
    document.getElementById('voice-waveform').classList.remove('recording');
    document.getElementById('voice-countdown-overlay').classList.remove('active');
  }

  function updateSentenceText() {
    const raw = sentences[currentSentence];
    // base: 검정 일반 텍스트
    document.getElementById('voice-sentence-base').innerHTML =
      raw.replace(/\n/g, '<br>');

    // fill: 글자마다 span.char (줄바꿈은 <br> 유지)
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
    // fillTimer는 setTimeout 여러 개라 일괄 제거 불가 → 플래그로 처리
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
    // 'mic': 기본값 유지
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
      // 음성 측정 완료 → 얼굴 측정 안내로 전환
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
  let faceLandmarker = null;      // FaceDetector → FaceLandmarker
  let faceDetectionLoop = null;
  let faceDetected = false;
  let faceMeasuring = false;      // 30초 측정 진행 중 플래그

  // dim: 프레임 실제 위치 기준으로 4개 패널을 배치해 구멍을 만듦
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
    const fW     = Math.round(frameRect.width);
    const fH     = Math.round(frameRect.height);

    const color  = 'rgba(0,0,0,0.50)';

    // 4개 패널 HTML로 구멍 영역을 비워 둠
    dimEl.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;height:${top}px;background:${color};"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:${bottom}px;background:${color};"></div>
      <div style="position:absolute;top:${top}px;left:0;width:${left}px;height:${fH}px;background:${color};"></div>
      <div style="position:absolute;top:${top}px;right:0;width:${right}px;height:${fH}px;background:${color};"></div>
    `;
  }

  async function startFaceRecord() {
    document.getElementById('ai-view-face').style.display = 'none';
    const faceRecordView = document.getElementById('ai-view-face-record');
    faceRecordView.style.display = 'flex';

    // 헤더 + 탭 숨김 (풀스크린)
    document.querySelector('.phone').classList.add('face-fullscreen');
    window.scrollTo(0, 0);

    // 초기 상태 리셋
    faceDetected = false;
    document.getElementById('face-loading-overlay').style.display = 'flex';
    document.getElementById('face-frame-overlay').style.display = 'none';
    document.getElementById('face-frame-dim').style.display = 'none';
    document.getElementById('face-error-overlay').style.display = 'none';
    document.getElementById('face-camera-feed').style.display = 'none';
    document.getElementById('face-start-btn').classList.add('face-inactive');
    document.getElementById('face-start-btn').disabled = false;
    document.getElementById('face-start-btn').style.opacity = '';
    document.getElementById('face-frame').classList.remove('detected');
    document.getElementById('face-bottom-label').textContent = '얼굴을 프레임 안에 맞춰주세요';
    document.getElementById('face-bottom-label').style.color = '';
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
        // 프레임 실제 위치 계산 후 dim clip-path 설정
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
    // FaceLandmarker 모듈 로드 대기
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

  // canvas 크기를 camera wrap에 맞게 동기화
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

    // 접속선 — 삼각망(tessellation)
    const conns = (window._FaceLandmarker && window._FaceLandmarker.FACE_LANDMARKS_TESSELATION) || [];
    ctx.strokeStyle = 'rgba(140,203,164,0.35)';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    for (const { start, end } of conns) {
      const s = landmarks[start];
      const e = landmarks[end];
      if (!s || !e) continue;
      // video는 CSS scaleX(-1)로 미러됨 → canvas도 같은 scaleX(-1) 변환
      // canvas transform은 CSS에서 처리하므로 좌표 그대로 사용
      ctx.moveTo(s.x * w, s.y * h);
      ctx.lineTo(e.x * w, e.y * h);
    }
    ctx.stroke();

    // 외곽선 — 얼굴 윤곽
    const contour = (window._FaceLandmarker && window._FaceLandmarker.FACE_LANDMARKS_FACE_OVAL) || [];
    ctx.strokeStyle = 'rgba(140,203,164,0.75)';
    ctx.lineWidth = 1.4;
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

    // 랜드마크 점
    ctx.fillStyle = 'rgba(140,203,164,0.8)';
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * w, lm.y * h, 0.9, 0, Math.PI * 2);
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
        // 랜드마크 그리기 (측정 중이거나 canvas가 보일 때)
        if (canvas.classList.contains('visible')) {
          drawLandmarks(ctx, results.faceLandmarks[0], w, h);
        } else {
          ctx.clearRect(0, 0, w, h);
        }

        // 첫 번째 랜드마크로 얼굴 bbox 추정 (x, y 범위)
        const lms = results.faceLandmarks[0];
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        for (const lm of lms) {
          if (lm.x < minX) minX = lm.x;
          if (lm.x > maxX) maxX = lm.x;
          if (lm.y < minY) minY = lm.y;
          if (lm.y > maxY) maxY = lm.y;
        }
        const fw = maxX - minX;
        const fh = maxY - minY;
        const faceCx = (minX + maxX) / 2;
        const faceCy = (minY + maxY) / 2;

        // 프레임 영역
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
      } else {
        ctx.clearRect(0, 0, w, h);
        if (faceDetected && !faceMeasuring) {
          faceDetected = false;
          frameEl.classList.remove('detected');
          document.getElementById('face-start-btn').classList.add('face-inactive');
          document.getElementById('face-bottom-label').textContent = '얼굴을 프레임 안에 맞춰주세요';
        }
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

  let faceCountdownTimer = null;

  function confirmFaceDetected() {
    if (faceCountdownTimer) return;
    // 버튼 비활성, 하단 텍스트 변경
    document.getElementById('face-start-btn').disabled = true;
    document.getElementById('face-start-btn').style.opacity = '0.5';
    document.getElementById('face-bottom-label').textContent = '측정이 곧 시작됩니다';
    document.getElementById('face-bottom-label').style.color = '#2f6c46';
    startFaceCountdown();
  }

  function startFaceCountdown() {
    let count = 3;
    const overlay = document.getElementById('face-countdown-overlay');
    const numEl   = document.getElementById('face-countdown-num');

    overlay.classList.add('active');
    numEl.textContent = count;
    document.getElementById('face-bottom-label').textContent = `${count}초 후 측정이 시작됩니다`;
    document.getElementById('face-bottom-label').style.color = '#2f6c46';

    faceCountdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        numEl.style.animation = 'none';
        void numEl.offsetWidth;
        numEl.style.animation = 'faceCountPop 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        numEl.textContent = count;
        document.getElementById('face-bottom-label').textContent = `${count}초 후 측정이 시작됩니다`;

        // 카운트다운 2초 시점: canvas fade-in 시작
        if (count === 2) {
          const canvas = document.getElementById('face-landmark-canvas');
          if (canvas) canvas.classList.add('visible');
        }
      } else {
        clearInterval(faceCountdownTimer);
        faceCountdownTimer = null;
        overlay.classList.remove('active');
        document.getElementById('face-bottom-label').textContent = '잘 측정되고 있어요!';
        document.getElementById('face-bottom-sub').textContent = '지금처럼 화면을 계속 바라보세요.';

        // 30초 측정 시작
        startFaceMeasureTimer();
      }
    }, 1000);
  }

  let faceMeasureTimer  = null;
  const FACE_MEASURE_TOTAL = 30; // 초

  function startFaceMeasureTimer() {
    faceMeasuring = true;

    const timerEl    = document.getElementById('face-measure-timer');
    const progressWrap = document.getElementById('face-measure-progress-wrap');
    const pctEl      = document.getElementById('face-measure-progress-pct');
    const fillEl     = document.getElementById('face-measure-progress-fill');

    timerEl.classList.add('active');
    progressWrap.classList.add('active');

    let elapsed = 0;

    function formatTime(sec) {
      const m = String(Math.floor(sec / 60)).padStart(2, '0');
      const s = String(sec % 60).padStart(2, '0');
      return `${m}:${s}`;
    }

    // 초기값
    timerEl.textContent = formatTime(FACE_MEASURE_TOTAL - elapsed);
    pctEl.textContent   = '0%';
    fillEl.style.width  = '0%';

    faceMeasureTimer = setInterval(() => {
      elapsed++;
      const remaining = FACE_MEASURE_TOTAL - elapsed;
      const pct = Math.round((elapsed / FACE_MEASURE_TOTAL) * 100);

      timerEl.textContent = formatTime(remaining);
      pctEl.textContent   = `${pct}%`;
      fillEl.style.width  = `${pct}%`;

      if (elapsed >= FACE_MEASURE_TOTAL) {
        clearInterval(faceMeasureTimer);
        faceMeasureTimer = null;
        faceMeasuring = false;
        onFaceMeasureComplete();
      }
    }, 1000);
  }

  function onFaceMeasureComplete() {
    // 측정 완료 후 처리 — 실제 서비스에서는 결과 화면으로 전환
    document.getElementById('face-bottom-label').textContent = '측정이 완료되었어요!';
    document.getElementById('face-bottom-label').style.color = '#2f6c46';
    document.getElementById('face-bottom-sub').textContent = '결과를 분석하고 있습니다.';
    // 타이머·프로그레스 숨김
    document.getElementById('face-measure-timer').classList.remove('active');
    document.getElementById('face-measure-progress-wrap').classList.remove('active');
    // canvas fade-out
    const canvas = document.getElementById('face-landmark-canvas');
    if (canvas) canvas.classList.remove('visible');
  }

  function stopFaceDetection() {
    if (faceDetectionLoop) { cancelAnimationFrame(faceDetectionLoop); faceDetectionLoop = null; }
    if (faceLandmarker) { faceLandmarker.close(); faceLandmarker = null; }
    if (faceCountdownTimer) { clearInterval(faceCountdownTimer); faceCountdownTimer = null; }
    if (faceMeasureTimer)   { clearInterval(faceMeasureTimer);   faceMeasureTimer = null; }
    document.getElementById('face-countdown-overlay')?.classList.remove('active');
    document.getElementById('face-measure-timer')?.classList.remove('active');
    document.getElementById('face-measure-progress-wrap')?.classList.remove('active');
    const canvas = document.getElementById('face-landmark-canvas');
    if (canvas) { canvas.classList.remove('visible'); }
    // 헤더 + 탭 복구
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
  let isMeasuring = false;       // 측정 진행 중 여부
  let pendingTabIndex = null;    // 이동하려던 탭 인덱스
  let pendingAction = null;      // 'tab' | 'back'

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
    // 브라우저 뒤로가기 인터셉트를 위해 history 다시 추가
    history.pushState({ measuring: true }, '');
  }

  function confirmExit() {
    document.getElementById('measure-exit-dim').classList.remove('active');
    isMeasuring = false;
    // 카메라 정리
    if (faceStream) { faceStream.getTracks().forEach(t => t.stop()); faceStream = null; }
    clearAllTimers();
    stopRecording();
    if (voiceLottie) { voiceLottie.stop(); voiceLottie = null; }
    if (faceLottie) { faceLottie.stop(); faceLottie = null; }

    if (pendingAction === 'tab' && pendingTabIndex !== null) {
      // 팝업 없이 탭 전환
      _switchNavTabDirect(pendingTabIndex);
    } else {
      // 게이지 화면으로 복귀
      ['ai-view-guide','ai-view-voice','ai-view-record','ai-view-face','ai-view-face-record'].forEach(id => {
        document.getElementById(id).style.display = 'none';
      });
      document.getElementById('ai-view-gauge').style.display = 'flex';
      // 게이지 애니메이션 재실행
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

  // 브라우저 뒤로가기 인터셉트
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
    // 측정 중이면 팝업 노출
    if (isMeasuring) {
      showExitModal('tab', index);
      return;
    }
    _switchNavTabDirect(index);
  }

  function _switchNavTabDirect(index) {
    document.querySelectorAll('.nav-tab').forEach((t, i) => {
      t.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.nav-pane').forEach((p, i) => {
      p.style.display = i === index ? '' : 'none';
    });
    window.scrollTo(0, 0);

    if (index === 2) {
      document.getElementById('ai-view-gauge').style.display = 'flex';
      document.getElementById('ai-view-guide').style.display = 'none';
      document.getElementById('ai-view-voice').style.display = 'none';
      document.getElementById('ai-view-record').style.display = 'none';
      document.getElementById('ai-view-face').style.display = 'none';
      document.getElementById('ai-view-face-record').style.display = 'none';
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
  const DEPRESSION_SCORE = 25;   // PHQ-9 총점
  const ANXIETY_SCORE    = 11;   // GAD-7 총점
  const Q9_FLAG          = true; // 9번 문항 1점 이상 여부

  // 우울 단계 데이터
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

  // 불안 단계 데이터
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

    // 우울 렌더링
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

    // 불안 렌더링
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
        // Small delay so transition fires after paint
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
