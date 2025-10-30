import { useState, useEffect, useRef } from "react";

interface DrawingScreenProps {
  nicknames: string[];
  onComplete: (winner: string) => void;
}

const DrawingScreen = ({ nicknames, onComplete }: DrawingScreenProps) => {
  const [currentName, setCurrentName] = useState("");
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [speed, setSpeed] = useState(50);
  const [remainingSeconds, setRemainingSeconds] = useState(60);
  
  const startTimeRef = useRef(Date.now());
  const intervalsRef = useRef<{ progress?: NodeJS.Timeout; seconds?: NodeJS.Timeout; name?: NodeJS.Timeout; complete?: NodeJS.Timeout }>({});

  const handleInstantDraw = () => {
    // Jump to 3 seconds remaining
    startTimeRef.current = Date.now() - 57000; // 60000 - 3000
  };

  useEffect(() => {
    const totalDuration = 60000; // 60 seconds
    const countdownStart = 57000; // Start countdown at 57 seconds
    startTimeRef.current = Date.now();

    // Progress timer - 100ms for smooth animation
    intervalsRef.current.progress = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Calculate remaining seconds
      const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));

      // Adjust speed based on progress
      const newSpeed = 50 + (elapsed / totalDuration) * 450; // 50ms to 500ms
      setSpeed(newSpeed);

      // Start countdown
      if (elapsed >= countdownStart && elapsed < totalDuration) {
        setCountdown(remaining);
      } else if (elapsed >= totalDuration) {
        setCountdown(null);
      }
    }, 100);

    // Update seconds display every 1 second
    intervalsRef.current.seconds = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((totalDuration - elapsed) / 1000));
      setRemainingSeconds(remaining);
    }, 1000);

    // Name shuffling
    const shuffleNames = () => {
      const randomName = nicknames[Math.floor(Math.random() * nicknames.length)];
      setCurrentName(randomName);
      intervalsRef.current.name = setTimeout(shuffleNames, speed);
    };
    shuffleNames();

    // Complete after 60 seconds
    intervalsRef.current.complete = setTimeout(() => {
      if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress);
      if (intervalsRef.current.seconds) clearInterval(intervalsRef.current.seconds);
      if (intervalsRef.current.name) clearTimeout(intervalsRef.current.name);
      const winner = nicknames[Math.floor(Math.random() * nicknames.length)];
      setCurrentName(winner);
      setTimeout(() => {
        onComplete(winner);
      }, 500);
    }, totalDuration);

    return () => {
      if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress);
      if (intervalsRef.current.seconds) clearInterval(intervalsRef.current.seconds);
      if (intervalsRef.current.name) clearTimeout(intervalsRef.current.name);
      if (intervalsRef.current.complete) clearTimeout(intervalsRef.current.complete);
    };
  }, [nicknames, onComplete, speed]);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/30 via-background to-accent/20 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-4xl space-y-12 relative z-10">
        {/* Circular Timer Clock */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48 md:w-64 md:h-64">
            {/* SVG Clock */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
                fill="none"
                opacity="0.2"
              />
              {/* Progress circle */}
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
                strokeDasharray={534.07}
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
              {/* Clock hand */}
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
              {/* Center dot */}
              <circle cx="100" cy="100" r="8" fill="hsl(var(--foreground))" />
            </svg>

            {/* Center text */}
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

        {/* Main display area */}
        <div className="relative">
          {countdown !== null && countdown <= 3 && countdown > 0 ? (
            // Countdown display
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
            // Name shuffling display
            <div className="text-center">
              <div
                className="text-6xl md:text-8xl font-black text-foreground drop-shadow-2xl transition-all duration-1000 break-all px-4"
                style={{
                  animation: `${speed < 200 ? "pulse 0.3s ease-in-out infinite" : "none"}`,
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

        {/* Participant count and Instant Draw button */}
        <div className="text-center space-y-6">
          <p className="text-xl text-muted-foreground font-medium">
            총 <span className="text-primary font-bold">{nicknames.length}명</span> 중 추첨 중
          </p>
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