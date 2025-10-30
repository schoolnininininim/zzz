import { useState, useEffect, useRef } from "react";

// --- Props 정의 ---

interface DrawingScreenProps {
  nicknames: string[];
  onComplete: (winner: string) => void;
}

// --- 컴포넌트 본문 ---

const DrawingScreen = ({ nicknames, onComplete }: DrawingScreenProps) => {
  // --- 상태 (State) ---
  const [currentName, setCurrentName] = useState("");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  // --- 참조 (Refs) ---
  // Refs는 리렌더링을 유발하지 않고 값을 저장하는 데 사용됩니다.
  const startTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null); // 애니메이션 루프 ID
  const lastShuffleTimeRef = useRef(Date.now()); // 마지막 이름 셔플 시간
  const winnerTimeoutRef = useRef<NodeJS.Timeout | null>(null); // 당첨자 발표 딜레이 ID

  // --- 이벤트 핸들러 ---

  /** 즉시 추첨 버튼 핸들러 */
  const handleInstantDraw = () => {
    // 남은 시간을 3초로 즉시 변경
    startTimeRef.current = Date.now() - 57000; // 60000ms - 3000ms
    // 혹시 모를 기존 당첨자 발표 타임아웃 제거
    if (winnerTimeoutRef.current) {
      clearTimeout(winnerTimeoutRef.current);
    }
  };

  // --- 메인 로직 (Effect) ---

  useEffect(() => {
    const totalDuration = 60000; // 60초
    const countdownStart = 57000; // 57초(3초 남았을 때)부터 카운트다운 시작
    startTimeRef.current = Date.now();
    lastShuffleTimeRef.current = Date.now();

    /**
     * 모든 타이머와 상태 업데이트를 관리하는 메인 애니메이션 루프.
     * requestAnimationFrame을 사용하여 브라우저가 렌더링할 준비가 될 때마다 실행됩니다.
     */
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      // 1. 종료 조건 확인
      if (elapsed >= totalDuration) {
        setProgress(100);
        setRemainingSeconds(0);
        setCountdown(null);

        // 애니메이션 루프 중지
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        // 최종 당첨자 선정
        const winner = nicknames[Math.floor(Math.random() * nicknames.length)];
        setCurrentName(winner);

        // 짧은 딜레이 후 onComplete 콜백 실행 (당첨자 확인 시간)
        winnerTimeoutRef.current = setTimeout(() => {
          onComplete(winner);
        }, 500);
        return; // 루프 종료
      }

      // 2. 모든 파생 상태 계산
      const newProgress = (elapsed / totalDuration) * 100;
      const newRemaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));
      // 속도 계산 (50ms에서 500ms로 점차 느려짐)
      const newSpeed = 50 + (newProgress / 100) * 450; 
      const newCountdown = elapsed >= countdownStart ? newRemaining : null;

      // 3. React 상태 업데이트 (리렌더링 유발)
      setProgress(newProgress);
      setRemainingSeconds(newRemaining);
      setCountdown(newCountdown);

      // 4. 현재 속도(newSpeed)에 맞춰 이름 셔플링
      // (Ref 값을 비교하므로 리렌더링을 유발하지 않음)
      if (Date.now() - lastShuffleTimeRef.current > newSpeed) {
        lastShuffleTimeRef.current = Date.now();
        const randomName = nicknames[Math.floor(Math.random() * nicknames.length)];
        setCurrentName(randomName); // 이름 상태 업데이트
      }

      // 5. 다음 프레임 요청
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // 애니메이션 루프 시작
    animationFrameRef.current = requestAnimationFrame(animate);

    // --- 정리(Cleanup) 함수 ---
    // 컴포넌트가 언마운트되거나 useEffect가 다시 실행될 때 호출됩니다.
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (winnerTimeoutRef.current) {
        clearTimeout(winnerTimeoutRef.current);
      }
    };
    // 의존성 배열: 이 값들이 변경될 때만 effect가 다시 실행됩니다.
  }, [nicknames, onComplete]);


  // --- JSX 렌더링 ---

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/30 via-background to-accent/20 relative overflow-hidden">
      {/* 1. 애니메이션 배경 */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-4xl space-y-12 relative z-10">
        {/* 2. 원형 타이머 시계 */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48 md:w-64 md:h-64">
            {/* SVG 시계 그래픽 */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* 배경 원 */}
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
                fill="none"
                opacity="0.2"
              />
              {/* 진행 상태 원 */}
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke={
                  remainingSeconds > 30
                    ? "hsl(var(--primary))"
                    : remainingSeconds > 10
                    ? "hsl(var(--accent))"
                    : "hsl(var(--destructive))"
                }
                strokeWidth="12"
                fill="none"
                strokeDasharray={534.07} // (2 * Math.PI * 85)
                strokeDashoffset={534.07 * (1 - progress / 100)}
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{
                  filter:
                    remainingSeconds <= 10
                      ? "drop-shadow(0 0 8px hsl(var(--destructive)))"
                      : "drop-shadow(0 0 8px hsl(var(--primary)))",
                }}
              />
              {/* 시계 바늘 */}
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke={
                  remainingSeconds > 30
                    ? "hsl(var(--primary))"
                    : remainingSeconds > 10
                    ? "hsl(var(--accent))"
                    : "hsl(var(--destructive))"
                }
                strokeWidth="4"
                strokeLinecap="round"
                className="transition-all duration-300"
                style={{
                  transform: `rotate(${(progress / 100) * 360}deg)`,
                  transformOrigin: "100px 100px",
                }}
              />
              {/* 중앙 점 */}
              <circle cx="100" cy="100" r="8" fill="hsl(var(--foreground))" />
            </svg>

            {/* 중앙 텍스트 (남은 시간) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className={`text-5xl md:text-6xl font-black transition-all duration-300 ${
                  remainingSeconds <= 10 ? "animate-pulse text-destructive" : "text-foreground"
                }`}
              >
                {remainingSeconds}
              </div>
              <div className="text-sm md:text-base text-muted-foreground font-medium mt-1">
                초
              </div>
            </div>
          </div>
        </div>

        {/* 3. 메인 디스플레이 영역 (카운트다운 또는 이름) */}
        <div className="relative">
          {countdown !== null && countdown <= 3 && countdown > 0 ? (
            // 3-2-1 카운트다운 표시
            <div className="text-center animate-shake">
              <div
                className="text-[20rem] font-black text-accent drop-shadow-2xl animate-pulse-fast"
                style={{
                  textShadow: "0 0 80px hsl(var(--accent)), 0 0 120px hsl(var(--accent))",
                }}
              >
                {countdown}
              </div>
            </div>
          ) : (
            // 이름 셔플링 표시
            <div className="text-center">
              <div
                className="text-6xl md:text-8xl font-black text-foreground drop-shadow-2xl transition-all duration-1000 break-all px-4"
                style={{
                  animation: `${progress < 90 ? "pulse 0.3s ease-in-out infinite" : "none"}`,
                  textShadow: "0 0 40px hsl(var(--primary)/0.5)",
                  opacity: remainingSeconds <= 3 ? Math.max(0.2, remainingSeconds / 10) : 1,
                }}
              >
                {currentName}
              </div>
              <div className="mt-8 flex gap-2 justify-center">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. 참가자 수 및 즉시 추첨 버튼 */}
        <div className="text-center space-y-6">
          <p className="text-xl text-muted-foreground font-medium">
            총 <span className="text-primary font-bold">{nicknames.length}명</span> 중 추첨 중
          </p>
          {/* 3초 이상 남았을 때만 버튼 표시 */}
          {remainingSeconds > 3 && (
            <button
              onClick={handleInstantDraw}
              className="px-8 py-3 bg-accent text-accent-foreground font-bold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              ⚡ 즉시 추첨
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrawingScreen;