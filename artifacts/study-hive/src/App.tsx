import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useContext,
  useEffect,
  useRef,
  useState,
  createContext,
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  Link,
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
} from "wouter";
import {
  AlarmClock,
  ArrowRight,
  Beaker,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  Command,
  Compass,
  FlaskConical,
  Focus,
  GripVertical,
  Hash,
  Home,
  Info,
  Keyboard,
  LibraryBig,
  LockKeyhole,
  Menu,
  MessageCircle,
  Minus,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Trophy,
  Users,
  X,
  Zap,
} from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

type Grade = "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
type PracticalPreview = {
  id: string;
  grade: Grade;
  subject: string;
  title: string;
  objective: string;
  apparatus: string[];
  localAlternatives: string[];
  steps: string[];
  safetyNote: string;
  videoUrl?: string;
  verified: boolean;
};
type QuestionDraft = {
  id: string;
  grade: Grade;
  subject: string;
  title: string;
  body: string;
  createdAt: string;
  localVoteCount: number;
};
type StudySession = {
  id: string;
  subject: string;
  durationMinutes: number;
  completedAt: string;
};
type FocusState = {
  timerMode: "focus" | "break";
  durationMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  selectedSubject: string;
};
type LearnerDemo = { grade: Grade; xp: number; streak: number };

const STORAGE = {
  learner: "study-hive-learner",
  saved: "study-hive-saved-books",
  focus: "study-hive-focus",
  sessions: "study-hive-sessions",
  questions: "study-hive-questions",
};
const grades: Grade[] = ["S1", "S2", "S3", "S4", "S5", "S6"];
const subjects = [
  "Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "English",
  "Geography",
];
const samples: PracticalPreview[] = [
  {
    id: "p1",
    grade: "S1",
    subject: "Biology",
    title: "Leaf detectives: testing for starch",
    objective: "Observe how a leaf stores food after light exposure.",
    apparatus: ["Fresh green leaf", "Warm water", "Iodine solution", "Cup"],
    localAlternatives: ["Clean glass", "Small saucepan with adult supervision"],
    steps: [
      "Boil the leaf briefly to soften it.",
      "Place it in warm ethanol only with a trained adult; do not heat ethanol directly.",
      "Rinse and add iodine solution.",
      "Record the colour change in a simple table.",
    ],
    safetyNote:
      "Preview procedure: ask a teacher to demonstrate the ethanol step. Never heat ethanol over a flame.",
    verified: false,
  },
  {
    id: "p2",
    grade: "S2",
    subject: "Chemistry",
    title: "Separating a salt and sand mixture",
    objective:
      "Use differences in solubility and filtration to separate materials.",
    apparatus: ["Salt and sand", "Water", "Filter paper", "Funnel"],
    localAlternatives: [
      "Clean cloth as a filter",
      "Clear bottle cut by an adult",
    ],
    steps: [
      "Add water to the mixture and stir.",
      "Filter the mixture into a clean container.",
      "Evaporate water with teacher guidance to recover salt.",
      "Compare what remains in each container.",
    ],
    safetyNote:
      "Do not taste materials. Use eye protection and teacher supervision during heating.",
    verified: false,
  },
  {
    id: "p3",
    grade: "S3",
    subject: "Physics",
    title: "Measure the pulse of a torch circuit",
    objective: "Build a simple circuit and describe how current flows.",
    apparatus: [
      "Battery holder",
      "Small torch bulb",
      "Insulated wire",
      "Switch",
    ],
    localAlternatives: ["Two fresh cells in a holder", "Paper fastener switch"],
    steps: [
      "Connect the battery, switch and bulb in one loop.",
      "Close the switch and observe the bulb.",
      "Open the switch and sketch the circuit.",
      "Explain why a complete loop matters.",
    ],
    safetyNote:
      "Use low-voltage cells only. Never connect wires to a wall socket.",
    verified: false,
  },
  {
    id: "p4",
    grade: "S4",
    subject: "Geography",
    title: "Rainfall records in your neighbourhood",
    objective: "Turn repeated observations into a clear climate record.",
    apparatus: ["Ruler", "Straight-sided container", "Notebook"],
    localAlternatives: [
      "A recycled bottle cut safely by an adult",
      "Ruler marked in centimetres",
    ],
    steps: [
      "Place a container in an open area away from roofs.",
      "Read the water level after rainfall at the same time each day.",
      "Record dates and measurements for one week.",
      "Discuss patterns and possible sources of error.",
    ],
    safetyNote:
      "Place the container where it cannot trip anyone. Do not collect drinking water from it.",
    verified: false,
  },
  {
    id: "p5",
    grade: "S5",
    subject: "Biology",
    title: "Osmosis with a plant tissue model",
    objective: "Use mass and texture changes to model movement of water.",
    apparatus: ["Potato strips", "Salt solutions", "Cups", "Balance"],
    localAlternatives: ["Kitchen scale", "Marked bottle caps"],
    steps: [
      "Cut equal strips and record starting mass.",
      "Place strips in differently concentrated solutions.",
      "Wait and record final mass.",
      "Compare evidence and write a conclusion.",
    ],
    safetyNote:
      "Wash hands after handling materials. Do not consume the samples.",
    verified: false,
  },
  {
    id: "p6",
    grade: "S6",
    subject: "Chemistry",
    title: "Acid and base indicators from plants",
    objective: "Compare colour changes in a natural indicator.",
    apparatus: [
      "Red cabbage extract",
      "Lemon juice",
      "Soap solution",
      "Clear cups",
    ],
    localAlternatives: [
      "Purple flower petals steeped in warm water",
      "Small transparent jars",
    ],
    steps: [
      "Prepare indicator with warm water and teacher guidance.",
      "Add a few drops to each labelled solution.",
      "Record colours without tasting.",
      "Arrange results from more acidic to more basic.",
    ],
    safetyNote:
      "Wear eye protection and do not mix unknown household cleaners.",
    verified: false,
  },
];

const initialLearner: LearnerDemo = { grade: "S2", xp: 0, streak: 0 };
const initialFocus: FocusState = {
  timerMode: "focus",
  durationMinutes: 25,
  remainingSeconds: 25 * 60,
  isRunning: false,
  selectedSubject: "Mathematics",
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as T;
    if (key === STORAGE.learner) {
      const learner = stored as LearnerDemo;
      if (learner.xp === 340 && learner.streak === 4)
        return { ...initialLearner, grade: learner.grade } as T;
    }
    if (key === STORAGE.focus) {
      const focus = stored as Partial<FocusState>;
      return {
        ...initialFocus,
        ...focus,
        durationMinutes: focus.durationMinutes ?? 25,
      } as T;
    }
    return stored;
  } catch {
    return fallback;
  }
}
function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback));
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* browser demo only */
    }
  }, [key, value]);
  return [value, setValue] as const;
}

type HiveContextType = {
  learner: LearnerDemo;
  setLearner: Dispatch<SetStateAction<LearnerDemo>>;
  saved: string[];
  setSaved: Dispatch<SetStateAction<string[]>>;
  focus: FocusState;
  setFocus: Dispatch<SetStateAction<FocusState>>;
  sessions: StudySession[];
  setSessions: Dispatch<SetStateAction<StudySession[]>>;
  questions: QuestionDraft[];
  setQuestions: Dispatch<SetStateAction<QuestionDraft[]>>;
  debug: boolean;
  setDebug: Dispatch<SetStateAction<boolean>>;
};
const HiveContext = createContext<HiveContextType | null>(null);
function useHive() {
  const context = useContext(HiveContext);
  if (!context) throw new Error("Study Hive context unavailable");
  return context;
}

function DemoRibbon() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 bg-primary px-4 py-2 text-[11px] font-semibold tracking-wide text-primary-foreground">
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-secondary" /> DEMO MODE · NO
        ACCOUNT IS SIGNED IN
      </span>
      <span className="opacity-85">Your local data stays in this browser.</span>
    </div>
  );
}

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/library", label: "Practical library", icon: LibraryBig },
  { href: "/focus", label: "Focus tools", icon: Focus },
  { href: "/peer-learning", label: "Peer learning", icon: Users },
  { href: "/science", label: "Science discovery", icon: Compass },
  { href: "/tutor", label: "Tutor preview", icon: MessageCircle },
  { href: "/classroom", label: "Classroom gateway", icon: LockKeyhole },
];

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { learner, setDebug } = useHive();
  const [mobileMore, setMobileMore] = useState(false);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        setDebug((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setDebug]);
  return (
    <div className="hive-shell min-h-[100dvh]">
      <DemoRibbon />
      <div className="mx-auto flex min-h-[calc(100dvh-35px)] max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-[hsl(42_39%_93%/.72)] px-4 py-6 lg:block">
          <Link
            href="/"
            className="focus-ring mb-9 flex items-center gap-3 rounded-xl px-2"
            data-testid="link-logo"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
              <Beaker size={22} />
            </span>
            <span>
              <strong className="block text-lg tracking-tight">
                Study Hive
              </strong>
              <small className="eyebrow">learn together</small>
            </span>
          </Link>
          <nav aria-label="Primary navigation" className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                data-testid={`link-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
                className={`nav-link focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${location === href ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/65 hover:bg-card hover:text-foreground"}`}
              >
                <Icon size={18} strokeWidth={location === href ? 2.5 : 2} />
                <span>{label}</span>
                {href === "/tutor" && (
                  <span className="ml-auto rounded-full bg-secondary/70 px-1.5 py-0.5 text-[9px] font-bold text-foreground">
                    SOON
                  </span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-10 rounded-2xl border border-secondary/45 bg-secondary/20 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="eyebrow">Little wins</span>
              <Trophy size={18} className="text-accent" />
            </div>
            <p className="text-sm font-semibold">
              {learner.streak > 0
                ? `${learner.streak} day${learner.streak === 1 ? "" : "s"} in a row.`
                : "Your first session is waiting."}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {learner.streak > 0
                ? "A small session today keeps the habit warm."
                : "Start with one short focus session."}
            </p>
            <Link
              href="/focus"
              className="focus-ring mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary"
            >
              Start a session <ArrowRight size={13} />
            </Link>
          </div>
          <p className="mt-10 px-2 text-[11px] leading-5 text-muted-foreground">
            Local demo only. Do not enter personal details; saved question
            drafts stay in this browser.
          </p>
        </aside>
        <main className="min-w-0 flex-1 pb-24 lg:pb-8">
          <header className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <Link
                href="/"
                className="focus-ring flex items-center gap-2"
                data-testid="link-mobile-logo"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Beaker size={19} />
                </span>
                <strong>Study Hive</strong>
              </Link>
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              <span className="h-2 w-2 rounded-full bg-accent"></span> A quiet
              place to make progress
            </div>
            <button
              type="button"
              onClick={() => setDebug((v) => !v)}
              className="focus-ring ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              data-testid="button-debug-toggle"
            >
              <Keyboard size={15} />{" "}
              <span className="hidden sm:inline">Developer panel</span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
                Ctrl ⇧ D
              </kbd>
            </button>
          </header>
          <div className="px-4 sm:px-8 lg:px-10">{children}</div>
        </main>
      </div>
      <nav
        className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-20 grid grid-cols-5 border-t border-border bg-card/95 px-2 pt-2 backdrop-blur lg:hidden"
        aria-label="Mobile navigation"
      >
        {navItems.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileMore(false)}
            className={`focus-ring flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-bold ${location === href ? "text-primary" : "text-muted-foreground"}`}
            data-testid={`mobile-nav-${label.toLowerCase().replaceAll(" ", "-")}`}
          >
            <Icon size={18} />
            <span>{label.split(" ")[0]}</span>
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMobileMore((value) => !value)}
          aria-expanded={mobileMore}
          aria-label="More pages"
          className={`focus-ring flex flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-bold ${mobileMore || navItems.slice(4).some((item) => item.href === location) ? "text-primary" : "text-muted-foreground"}`}
          data-testid="button-mobile-more"
        >
          {mobileMore ? <X size={18} /> : <Menu size={18} />}
          <span>More</span>
        </button>
      </nav>
      {mobileMore && (
        <div
          className="fixed bottom-[4.5rem] right-2 z-30 w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-border bg-card p-2 shadow-xl lg:hidden"
          aria-label="More pages"
        >
          {navItems.slice(4).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileMore(false)}
              className={`focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${location === href ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              data-testid={`mobile-more-${label.toLowerCase().replaceAll(" ", "-")}`}
            >
              <Icon size={17} />
              {label}
              {href === "/tutor" && (
                <span className="ml-auto rounded-full bg-secondary/70 px-2 py-0.5 text-[9px] font-bold">
                  SOON
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PageHeading({
  kicker,
  title,
  description,
  action,
}: {
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="animate-in mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="eyebrow mb-2">{kicker}</p>
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
function SoftBadge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "gold" | "coral" | "muted";
}) {
  const colors = {
    green: "bg-primary/10 text-primary",
    gold: "bg-secondary/45 text-foreground",
    coral: "bg-accent/10 text-accent",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${colors[tone]}`}
    >
      {children}
    </span>
  );
}
function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Search;
  title: string;
  body: string;
}) {
  return (
    <div className="hive-card flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-primary">
        <Icon size={23} />
      </span>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {body}
      </p>
    </div>
  );
}

function Dashboard() {
  const { learner, setLearner, saved, sessions } = useHive();
  const gradeBooks = samples.filter((item) => item.grade === learner.grade);
  const rank =
    learner.xp >= 1500
      ? "Knowledge Keeper"
      : learner.xp >= 750
        ? "Lab Explorer"
        : learner.xp >= 250
          ? "Study Scout"
          : "New Explorer";
  const badges = [
    { label: "First focus", earned: sessions.length >= 1 },
    { label: "Five sessions", earned: sessions.length >= 5 },
    { label: "Three-day streak", earned: learner.streak >= 3 },
    { label: "Helpful peer", earned: false },
  ];
  const [showClass, setShowClass] = useState(false);
  return (
    <div className="animate-in">
      <div className="mb-8 overflow-hidden rounded-[1.6rem] bg-primary px-6 py-8 text-primary-foreground hive-shadow sm:px-10 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow text-secondary">
            GOOD TO SEE YOU · {learner.grade}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            A little focus goes
            <br className="hidden sm:block" /> a long way.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-primary-foreground/75 sm:text-base">
            Study Hive brings practical learning and small study habits into a
            calm, single-device space.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/focus"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-foreground hover:brightness-105"
              data-testid="link-start-focus"
            >
              Start a focus session <ArrowRight size={16} />
            </Link>
            <Link
              href="/library"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-primary-foreground/25 px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-foreground/10"
              data-testid="link-open-library"
            >
              Browse practicals <BookOpen size={16} />
            </Link>
          </div>
        </div>
        <div className="mt-8 flex items-end gap-3 sm:absolute sm:bottom-8 sm:right-10 sm:mt-0">
          <div className="h-20 w-9 rounded-t-full bg-secondary/30" />
          <div className="h-28 w-10 rounded-t-full bg-secondary/55" />
          <div className="h-36 w-10 rounded-t-full bg-accent/80" />
          <div className="h-24 w-10 rounded-t-full bg-secondary/35" />
        </div>
      </div>
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Current streak",
            value: `${learner.streak} days`,
            sub: learner.streak
              ? "Keep the rhythm gentle"
              : "Begins after sessions on different days",
            icon: Zap,
          },
          {
            label: "Hive points",
            value: `${learner.xp} XP`,
            sub: "25 points per completed focus session",
            icon: Star,
          },
          {
            label: "Current rank",
            value: rank,
            sub: "Based on local focus points",
            icon: Trophy,
          },
          {
            label: "Sessions logged",
            value: String(sessions.length),
            sub: "Saved in this browser",
            icon: Clock3,
          },
        ].map(({ label, value, sub, icon: Icon }, i) => (
          <div
            key={label}
            className={`hive-card animate-in delay-${i + 1} p-5`}
            data-testid={`stat-${label.toLowerCase().replaceAll(" ", "-")}`}
          >
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                {label}
              </span>
              <Icon size={18} className="text-accent" />
            </div>
            <p className="mt-4 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
      <section
        className="hive-card mb-8 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        aria-label="Study badges"
      >
        <div>
          <p className="eyebrow">Study badges</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Earned from this browser’s study activity
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${badge.earned ? "bg-secondary/50 text-foreground" : "bg-muted text-muted-foreground"}`}
              data-testid={`badge-${badge.label.toLowerCase().replaceAll(" ", "-")}`}
            >
              <Star size={12} fill={badge.earned ? "currentColor" : "none"} />
              {badge.label}
              {badge.label === "Helpful peer" && !badge.earned
                ? " · shared mode off"
                : ""}
            </span>
          ))}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
        <section>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="eyebrow">Your next small step</p>
              <h2 className="mt-1 text-xl font-bold">
                Practical previews for {learner.grade}
              </h2>
            </div>
            <Link
              href="/library"
              className="focus-ring text-sm font-bold text-primary"
              data-testid="link-see-all-practicals"
            >
              See all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {gradeBooks.slice(0, 2).map((book, i) => (
              <BookCard key={book.id} book={book} compact index={i} />
            ))}
          </div>
          <div className="mt-5 hive-card flex flex-col justify-between gap-4 border-dashed p-5 sm:flex-row sm:items-center">
            <div>
              <p className="eyebrow">Change your class</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Demo preferences are saved locally and can be changed anytime.
              </p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowClass((v) => !v)}
                className="focus-ring flex min-w-28 items-center justify-between gap-6 rounded-lg border border-border bg-card px-3 py-2 text-sm font-bold"
                data-testid="button-change-grade"
              >
                {learner.grade}
                <ChevronDown size={15} />
              </button>
              {showClass && (
                <div className="absolute right-0 top-11 z-10 w-28 rounded-xl border border-border bg-card p-1 shadow-xl">
                  {grades.map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => {
                        setLearner((l) => ({ ...l, grade: g }));
                        setShowClass(false);
                      }}
                      className="focus-ring block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                      data-testid={`button-grade-${g}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="hive-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Study tools</p>
              <h2 className="mt-1 text-xl font-bold">Ready when you are</h2>
            </div>
            <Calculator className="text-accent" size={23} />
          </div>
          <div className="mt-5 space-y-2">
            {[
              {
                href: "/focus",
                title: "Pomodoro timer",
                detail: "25 minutes of calm focus",
                icon: TimerReset,
              },
              {
                href: "/focus",
                title: "Scientific calculator",
                detail: "Solve, convert, check",
                icon: Calculator,
              },
              {
                href: "/focus",
                title: "Periodic table",
                detail: "Search elements interactively",
                icon: FlaskConical,
              },
            ].map(({ href, title, detail, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="focus-ring flex items-center gap-3 rounded-xl border border-border/80 p-3 transition-colors hover:border-primary/30 hover:bg-muted/50"
                data-testid={`link-tool-${title.toLowerCase().replaceAll(" ", "-")}`}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/40 text-primary">
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-sm">{title}</strong>
                  <small className="text-xs text-muted-foreground">
                    {detail}
                  </small>
                </span>
                <ArrowRight size={15} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function BookCard({
  book,
  compact = false,
  index = 0,
}: {
  book: PracticalPreview;
  compact?: boolean;
  index?: number;
}) {
  const { saved, setSaved } = useHive();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const isSaved = saved.includes(book.id);
  const youtubeSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${book.title} science practical demonstration`)}`;
  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialogRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      (previousFocus ?? triggerRef.current)?.focus();
    };
  }, [open]);
  return (
    <>
      <article
        className={`hive-card animate-in delay-${index + 1} group flex flex-col ${compact ? "p-5" : "p-6"}`}
        data-testid={`card-practical-${book.id}`}
      >
        <div className="mb-5 flex items-start justify-between">
          <SoftBadge tone="gold">
            {book.grade} · {book.subject}
          </SoftBadge>
          <button
            type="button"
            aria-label={`${isSaved ? "Remove" : "Save"} ${book.title}`}
            onClick={() =>
              setSaved((prev) =>
                isSaved
                  ? prev.filter((x) => x !== book.id)
                  : [...prev, book.id],
              )
            }
            className={`focus-ring rounded-lg p-2 ${isSaved ? "bg-secondary/40 text-foreground" : "text-muted-foreground hover:bg-muted"}`}
            data-testid={`button-save-book-${book.id}`}
          >
            <Star size={17} fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        <h3 className="text-lg font-bold leading-snug">{book.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">
          {book.objective}
        </p>
        <div className="mt-5 flex items-center justify-between border-t border-border/70 pt-4">
          <span className="text-[11px] font-semibold text-muted-foreground">
            Sample activity · not NCDC-verified
          </span>
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen(true)}
            className="focus-ring inline-flex items-center gap-1 text-xs font-bold text-primary"
            data-testid={`button-open-book-${book.id}`}
          >
            Read preview <ArrowRight size={13} />
          </button>
        </div>
      </article>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-foreground/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`practical-title-${book.id}`}
            tabIndex={-1}
            className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-border bg-card p-6 shadow-2xl sm:rounded-3xl sm:p-8"
            data-testid={`dialog-practical-${book.id}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <SoftBadge tone="gold">
                  {book.grade} · {book.subject}
                </SoftBadge>
                <h2
                  id={`practical-title-${book.id}`}
                  className="mt-3 text-2xl font-bold"
                >
                  {book.title}
                </h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  {book.objective}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-muted"
                aria-label="Close practical preview"
                data-testid={`button-close-book-${book.id}`}
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <h3 className="text-sm font-bold">Apparatus</h3>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-6 text-muted-foreground">
                  {book.apparatus.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-muted p-4">
                <h3 className="text-sm font-bold">
                  Possible local alternatives
                </h3>
                <ul className="mt-3 list-inside list-disc space-y-1.5 text-sm leading-6 text-muted-foreground">
                  {book.localAlternatives.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-bold">Suggested procedure</h3>
              <ol className="mt-3 space-y-3">
                {book.steps.map((step, i) => (
                  <li
                    key={step}
                    className="flex gap-3 text-sm leading-6 text-muted-foreground"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6 rounded-xl border border-accent/25 bg-accent/5 p-4">
              <h3 className="text-sm font-bold text-accent">Safety note</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {book.safetyNote}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <p className="max-w-sm text-xs leading-5 text-muted-foreground">
                Sample activity only. Check all methods with a teacher and your
                approved curriculum materials.
              </p>
              <a
                href={youtubeSearch}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-bold text-primary"
                data-testid={`link-youtube-search-${book.id}`}
              >
                Search demos on YouTube <ArrowRight size={14} />
              </a>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Library() {
  const { learner, saved } = useHive();
  const [query, setQuery] = useState("");
  const [grade, setGrade] = useState<Grade | "all">("all");
  const [subject, setSubject] = useState("all");
  const unlockedThrough = grades.indexOf(learner.grade);
  const filtered = samples.filter(
    (b) =>
      grades.indexOf(b.grade) <= unlockedThrough &&
      (grade === "all" || b.grade === grade) &&
      (subject === "all" || b.subject === subject) &&
      (b.title + " " + b.objective + " " + b.subject)
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div>
      <PageHeading
        kicker="Practical previews"
        title="Learning you can hold onto."
        description="Browse small, practical activities by class and subject. These are clearly marked previews, not verified NCDC publications."
        action={
          <SoftBadge tone="coral">
            <Info size={13} className="mr-1" /> Content verification pending
          </SoftBadge>
        }
      />
      <section
        className="hive-card mb-6 p-5"
        aria-label="Progressive study access"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Demo book progression</p>
            <h2 className="mt-1 font-bold">
              Unlocked through {learner.grade} · {unlockedThrough + 1} of 6
              levels
            </h2>
          </div>
          <SoftBadge tone="gold">Local class preference only</SoftBadge>
        </div>
        <div
          className="mt-4 grid grid-cols-6 gap-2"
          aria-label={`${unlockedThrough + 1} of 6 preview levels unlocked`}
        >
          {grades.map((g, index) => (
            <div
              key={g}
              className={`rounded-lg px-2 py-2 text-center text-xs font-bold ${index <= unlockedThrough ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              {g}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          The grade selector is for this browser demo and does not verify
          enrollment or enforce access on a server.
        </p>
      </section>
      <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_150px_170px]">
        <label className="relative block">
          <Search
            size={17}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Search practicals"
            className="focus-ring h-11 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm"
            data-testid="input-search-practicals"
          />
        </label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value as Grade | "all")}
          className="focus-ring h-11 rounded-xl border border-border bg-background px-3 text-sm"
          data-testid="select-library-grade"
        >
          <option value="all">All unlocked classes</option>
          {grades.map((g, index) => (
            <option key={g} disabled={index > unlockedThrough}>
              {g}
              {index > unlockedThrough ? " · locked" : ""}
            </option>
          ))}
        </select>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="focus-ring h-11 rounded-xl border border-border bg-background px-3 text-sm"
          data-testid="select-library-subject"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">{filtered.length}</strong> preview
          {filtered.length === 1 ? "" : "s"} found · showing unlocked levels
          through <strong className="text-primary">{learner.grade}</strong>
        </p>
        <SoftBadge tone="muted">{saved.length} saved locally</SoftBadge>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No previews match that search"
          body="Try a broader subject, class, or a shorter search phrase."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      )}
      <div className="mt-8 flex gap-3 rounded-2xl border border-secondary/50 bg-secondary/20 p-5 text-sm">
        <Info className="mt-0.5 shrink-0 text-primary" size={18} />
        <p className="leading-6">
          Preview note: study material is sample content for this local demo and
          has not been verified against current NCDC sources.{" "}
          <a
            href="https://ncdc.go.ug/"
            target="_blank"
            rel="noreferrer"
            className="font-bold text-primary underline"
            data-testid="link-ncdc-source"
          >
            Visit the NCDC source
          </a>{" "}
          to cross-check official materials.
        </p>
      </div>
    </div>
  );
}

function TimerCard() {
  const { focus, setFocus } = useHive();
  const mins = String(Math.floor(focus.remainingSeconds / 60)).padStart(2, "0");
  const secs = String(focus.remainingSeconds % 60).padStart(2, "0");
  const total = (focus.timerMode === "focus" ? focus.durationMinutes : 5) * 60;
  const progress = `${Math.max(0, Math.min(100, ((total - focus.remainingSeconds) / total) * 100))}%`;
  return (
    <section
      id="timer"
      className="hive-card relative overflow-hidden p-6 sm:p-8"
    >
      <div className="flex flex-col justify-between gap-5 sm:flex-row">
        <div>
          <p className="eyebrow">Now focusing</p>
          <h2 className="mt-1 text-xl font-bold">
            {focus.timerMode === "focus"
              ? focus.selectedSubject
              : "Short reset"}
          </h2>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`h-2 w-2 rounded-full ${focus.isRunning ? "bg-accent" : "bg-muted-foreground/40"}`}
            />
            {focus.isRunning ? "Timer is running" : "Ready when you are"}
          </div>
        </div>
        <select
          value={focus.selectedSubject}
          onChange={(e) =>
            setFocus((f) => ({ ...f, selectedSubject: e.target.value }))
          }
          className="focus-ring h-10 rounded-lg border border-border bg-background px-3 text-sm"
          data-testid="select-focus-subject"
        >
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="my-7 flex flex-col items-center justify-center">
        <div
          className="timer-ring flex h-56 w-56 items-center justify-center rounded-full"
          style={{ "--progress": progress } as CSSProperties}
        >
          <div className="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-card">
            <span className="font-mono text-5xl font-bold tracking-tight">
              {mins}:{secs}
            </span>
            <span className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              {focus.timerMode}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => setFocus((f) => ({ ...f, isRunning: !f.isRunning }))}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          data-testid="button-timer-toggle"
        >
          {focus.isRunning ? <Pause size={17} /> : <Play size={17} />}{" "}
          {focus.isRunning ? "Pause" : "Start timer"}
        </button>
        <button
          type="button"
          onClick={() =>
            setFocus((f) => ({
              ...f,
              isRunning: false,
              remainingSeconds:
                (f.timerMode === "focus" ? f.durationMinutes : 5) * 60,
            }))
          }
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold"
          data-testid="button-timer-reset"
        >
          <RotateCcw size={16} /> Reset
        </button>
      </div>
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Focus length</span>
        {[15, 25, 45].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() =>
              setFocus((f) => ({
                ...f,
                durationMinutes: n,
                remainingSeconds: n * 60,
                isRunning: false,
                timerMode: "focus",
              }))
            }
            className={`focus-ring rounded-md px-2 py-1 font-mono ${focus.durationMinutes === n ? "bg-secondary text-foreground" : "hover:bg-muted"}`}
            data-testid={`button-focus-length-${n}`}
          >
            {n}m
          </button>
        ))}
      </div>
    </section>
  );
}

function evaluateExpression(input: string): number {
  const expression = input
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-");
  const tokens: string[] = [];
  let offset = 0;
  while (offset < expression.length) {
    const remainder = expression.slice(offset);
    if (!remainder.trim()) break;
    const match = remainder.match(
      /^\s*(?:(?:\d+(?:\.\d*)?|\.\d+)|[a-zA-Z]+|[()+\-*/%^])/,
    );
    if (!match) throw new Error("Invalid expression");
    tokens.push(match[0].trim());
    offset += match[0].length;
  }
  let cursor = 0;
  const expressionValue = (): number => {
    let value = term();
    while (tokens[cursor] === "+" || tokens[cursor] === "-") {
      const operator = tokens[cursor++];
      const next = term();
      value = operator === "+" ? value + next : value - next;
    }
    return value;
  };
  const term = (): number => {
    let value = power();
    while (
      tokens[cursor] === "*" ||
      tokens[cursor] === "/" ||
      tokens[cursor] === "%"
    ) {
      const operator = tokens[cursor++];
      const next = power();
      value =
        operator === "*"
          ? value * next
          : operator === "/"
            ? value / next
            : value % next;
    }
    return value;
  };
  const power = (): number => {
    const value = unary();
    if (tokens[cursor] === "^") {
      cursor++;
      return value ** power();
    }
    return value;
  };
  const unary = (): number => {
    if (tokens[cursor] === "+") {
      cursor++;
      return unary();
    }
    if (tokens[cursor] === "-") {
      cursor++;
      return -unary();
    }
    return primary();
  };
  const primary = (): number => {
    const token = tokens[cursor++];
    if (token === "(") {
      const value = expressionValue();
      if (tokens[cursor++] !== ")") throw new Error("Missing closing bracket");
      return value;
    }
    if (token === "pi") return Math.PI;
    if (token === "e") return Math.E;
    if (/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token ?? "")) return Number(token);
    if (/^[a-z]+$/i.test(token ?? "")) {
      if (tokens[cursor++] !== "(")
        throw new Error("Add parentheses after the function");
      const argument = expressionValue();
      if (tokens[cursor++] !== ")") throw new Error("Missing closing bracket");
      switch (token.toLowerCase()) {
        case "sin":
          return Math.sin((argument * Math.PI) / 180);
        case "cos":
          return Math.cos((argument * Math.PI) / 180);
        case "tan":
          return Math.tan((argument * Math.PI) / 180);
        case "log":
          return Math.log10(argument);
        case "ln":
          return Math.log(argument);
        case "sqrt":
          return Math.sqrt(argument);
        case "abs":
          return Math.abs(argument);
        default:
          throw new Error("Unknown function");
      }
    }
    throw new Error("Check the expression");
  };
  const result = expressionValue();
  if (cursor !== tokens.length || !Number.isFinite(result))
    throw new Error("Check the expression");
  return result;
}

function CalculatorCard() {
  const [value, setValue] = useState("");
  const [result, setResult] = useState("");
  const [unit, setUnit] = useState("km-mi");
  const [unitValue, setUnitValue] = useState("1");
  const calculate = () => {
    try {
      setResult(String(Number(evaluateExpression(value).toPrecision(10))));
    } catch {
      setResult("Check the expression");
    }
  };
  const conversions: Record<
    string,
    { label: string; convert: (number: number) => number; unit: string }
  > = {
    "km-mi": {
      label: "km → mi",
      convert: (number) => number * 0.621371,
      unit: "mi",
    },
    "mi-km": {
      label: "mi → km",
      convert: (number) => number * 1.60934,
      unit: "km",
    },
    "m-cm": { label: "m → cm", convert: (number) => number * 100, unit: "cm" },
    "kg-g": { label: "kg → g", convert: (number) => number * 1000, unit: "g" },
    "c-f": {
      label: "°C → °F",
      convert: (number) => (number * 9) / 5 + 32,
      unit: "°F",
    },
  };
  const amount = Number(unitValue);
  const converted = Number.isFinite(amount)
    ? `${conversions[unit].convert(amount).toFixed(3)} ${conversions[unit].unit}`
    : "Enter a number";
  return (
    <section id="calculator" className="hive-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Quick solve · angles in degrees</p>
          <h2 className="mt-1 text-xl font-bold">Scientific calculator</h2>
        </div>
        <Calculator size={22} className="text-accent" />
      </div>
      <div className="mt-5 flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && calculate()}
          placeholder="e.g. sin(30) + 4^2"
          aria-label="Calculator expression"
          className="focus-ring min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-3 font-mono text-sm"
          data-testid="input-calculator"
        />
        <button
          type="button"
          onClick={calculate}
          className="focus-ring rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
          data-testid="button-calculate"
        >
          =
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {["sin(", "cos(", "tan(", "log(", "ln(", "sqrt(", "pi", "^"].map(
          (token) => (
            <button
              key={token}
              type="button"
              onClick={() => setValue((current) => `${current}${token}`)}
              className="focus-ring rounded-md border border-border px-2 py-1 font-mono text-xs hover:bg-muted"
              data-testid={`button-calculator-${token}`}
            >
              {token}
            </button>
          ),
        )}
      </div>
      <p
        className="mt-3 min-h-6 font-mono text-sm text-primary"
        aria-live="polite"
        data-testid="text-calculator-result"
      >
        {result}
      </p>
      <div className="mt-5 border-t border-border pt-5">
        <p className="mb-3 text-xs font-bold text-muted-foreground">
          UNIT CONVERTER
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={unitValue}
            onChange={(e) => setUnitValue(e.target.value)}
            type="number"
            aria-label="Value to convert"
            className="focus-ring w-24 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="input-unit-value"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            aria-label="Unit conversion"
            className="focus-ring min-w-28 rounded-lg border border-border bg-background px-3 py-2 text-sm"
            data-testid="select-unit"
          >
            {Object.entries(conversions).map(([key, conversion]) => (
              <option key={key} value={key}>
                {conversion.label}
              </option>
            ))}
          </select>
          <span className="ml-auto font-mono text-sm font-bold">
            {converted}
          </span>
        </div>
      </div>
    </section>
  );
}

const elementRows = `H|Hydrogen|1.008
He|Helium|4.0026
Li|Lithium|6.94
Be|Beryllium|9.0122
B|Boron|10.81
C|Carbon|12.011
N|Nitrogen|14.007
O|Oxygen|15.999
F|Fluorine|18.998
Ne|Neon|20.180
Na|Sodium|22.990
Mg|Magnesium|24.305
Al|Aluminium|26.982
Si|Silicon|28.085
P|Phosphorus|30.974
S|Sulfur|32.06
Cl|Chlorine|35.45
Ar|Argon|39.948
K|Potassium|39.098
Ca|Calcium|40.078
Sc|Scandium|44.956
Ti|Titanium|47.867
V|Vanadium|50.942
Cr|Chromium|51.996
Mn|Manganese|54.938
Fe|Iron|55.845
Co|Cobalt|58.933
Ni|Nickel|58.693
Cu|Copper|63.546
Zn|Zinc|65.38
Ga|Gallium|69.723
Ge|Germanium|72.630
As|Arsenic|74.922
Se|Selenium|78.971
Br|Bromine|79.904
Kr|Krypton|83.798
Rb|Rubidium|85.468
Sr|Strontium|87.62
Y|Yttrium|88.906
Zr|Zirconium|91.224
Nb|Niobium|92.906
Mo|Molybdenum|95.95
Tc|Technetium|[98]
Ru|Ruthenium|101.07
Rh|Rhodium|102.906
Pd|Palladium|106.42
Ag|Silver|107.868
Cd|Cadmium|112.414
In|Indium|114.818
Sn|Tin|118.710
Sb|Antimony|121.760
Te|Tellurium|127.60
I|Iodine|126.904
Xe|Xenon|131.293
Cs|Cesium|132.905
Ba|Barium|137.327
La|Lanthanum|138.905
Ce|Cerium|140.116
Pr|Praseodymium|140.908
Nd|Neodymium|144.242
Pm|Promethium|[145]
Sm|Samarium|150.36
Eu|Europium|151.964
Gd|Gadolinium|157.25
Tb|Terbium|158.925
Dy|Dysprosium|162.500
Ho|Holmium|164.930
Er|Erbium|167.259
Tm|Thulium|168.934
Yb|Ytterbium|173.045
Lu|Lutetium|174.967
Hf|Hafnium|178.49
Ta|Tantalum|180.948
W|Tungsten|183.84
Re|Rhenium|186.207
Os|Osmium|190.23
Ir|Iridium|192.217
Pt|Platinum|195.084
Au|Gold|196.967
Hg|Mercury|200.592
Tl|Thallium|204.38
Pb|Lead|207.2
Bi|Bismuth|208.980
Po|Polonium|[209]
At|Astatine|[210]
Rn|Radon|[222]
Fr|Francium|[223]
Ra|Radium|[226]
Ac|Actinium|[227]
Th|Thorium|232.038
Pa|Protactinium|231.036
U|Uranium|238.029
Np|Neptunium|[237]
Pu|Plutonium|[244]
Am|Americium|[243]
Cm|Curium|[247]
Bk|Berkelium|[247]
Cf|Californium|[251]
Es|Einsteinium|[252]
Fm|Fermium|[257]
Md|Mendelevium|[258]
No|Nobelium|[259]
Lr|Lawrencium|[266]
Rf|Rutherfordium|[267]
Db|Dubnium|[268]
Sg|Seaborgium|[269]
Bh|Bohrium|[270]
Hs|Hassium|[277]
Mt|Meitnerium|[278]
Ds|Darmstadtium|[281]
Rg|Roentgenium|[282]
Cn|Copernicium|[285]
Nh|Nihonium|[286]
Fl|Flerovium|[289]
Mc|Moscovium|[290]
Lv|Livermorium|[293]
Ts|Tennessine|[294]
Og|Oganesson|[294]`;

function elementPosition(number: number) {
  if (number === 1) return { period: 1, group: 1 };
  if (number === 2) return { period: 1, group: 18 };
  if (number <= 4) return { period: 2, group: number - 2 };
  if (number <= 10) return { period: 2, group: number + 8 };
  if (number <= 12) return { period: 3, group: number - 10 };
  if (number <= 18) return { period: 3, group: number };
  if (number <= 36) return { period: 4, group: number - 18 };
  if (number <= 54) return { period: 5, group: number - 36 };
  if (number <= 57) return { period: 6, group: number - 54 };
  if (number <= 71) return { period: 8, group: number - 54 };
  if (number <= 86) return { period: 6, group: number - 68 };
  if (number <= 89) return { period: 7, group: number - 86 };
  if (number <= 103) return { period: 9, group: number - 86 };
  return { period: 7, group: number - 100 };
}

const elementData = elementRows.split("\n").map((row, index) => {
  const [symbol, name, mass] = row.split("|");
  const number = index + 1;
  return { symbol, name, mass, number, ...elementPosition(number) };
});

function PeriodicTable() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<(typeof elementData)[number] | null>(
    null,
  );
  const found = elementData.filter((element) =>
    `${element.symbol} ${element.name} ${element.number}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <section id="periodic-table" className="hive-card p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="eyebrow">Reference wall</p>
          <h2 className="mt-1 text-xl font-bold">Interactive periodic table</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Search 118 elements and select one for a quick reference.
          </p>
        </div>
        <label className="relative">
          <Search
            size={15}
            className="absolute left-3 top-3 text-muted-foreground"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Find an element"
            aria-label="Search periodic table"
            className="focus-ring h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm sm:w-44"
            data-testid="input-element-search"
          />
        </label>
      </div>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="grid min-w-[900px] grid-cols-[repeat(18,minmax(42px,1fr))] grid-rows-[repeat(9,minmax(66px,auto))] gap-1">
          {found.map((element) => (
            <button
              type="button"
              key={element.symbol}
              style={{ gridColumn: element.group, gridRow: element.period }}
              onClick={() => setSelected(element)}
              className={`table-cell focus-ring rounded-lg border p-1 text-left ${selected?.symbol === element.symbol ? "border-accent bg-accent/10" : "border-border bg-background hover:border-primary/40"}`}
              data-testid={`button-element-${element.symbol}`}
              aria-label={`${element.name}, atomic number ${element.number}`}
            >
              <span className="block font-mono text-[9px] text-muted-foreground">
                {element.number}
              </span>
              <strong className="mt-0.5 block text-base leading-5 text-primary">
                {element.symbol}
              </strong>
              <span className="block truncate text-[9px] text-muted-foreground">
                {element.name}
              </span>
            </button>
          ))}
        </div>
      </div>
      {selected && (
        <div
          className="mt-4 flex items-center gap-4 rounded-xl bg-muted p-4"
          data-testid="element-detail"
        >
          <span className="font-mono text-3xl font-bold text-primary">
            {selected.symbol}
          </span>
          <div>
            <strong>{selected.name}</strong>
            <p className="text-xs text-muted-foreground">
              Atomic number {selected.number} · Atomic mass {selected.mass}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="focus-ring ml-auto rounded-lg p-2 text-muted-foreground hover:bg-background"
            aria-label="Close element detail"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Values in brackets are representative mass numbers for elements without
        a standard atomic weight.
      </p>
    </section>
  );
}

function FocusPage() {
  const { sessions } = useHive();
  useEffect(() => {
    const anchor = window.location.hash.slice(1);
    if (anchor)
      window.requestAnimationFrame(() =>
        document
          .getElementById(anchor)
          ?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
  }, []);
  return (
    <div>
      <PageHeading
        kicker="Focus studio"
        title="Make space for one good thought."
        description="A timer, a calculator, and a reference wall for the moments when your desk needs less noise."
      />
      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <TimerCard />
        <CalculatorCard />
      </div>
      <div className="mt-6">
        <PeriodicTable />
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section id="formulas" className="hive-card p-6">
          <div className="flex items-center gap-2">
            <Hash size={18} className="text-accent" />
            <h2 className="font-bold">Formula reference</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ["Motion", "v = d ÷ t"],
              ["Force", "F = m × a"],
              ["Density", "ρ = m ÷ V"],
              ["Area of a circle", "A = πr²"],
            ].map(([name, formula]) => (
              <div key={name} className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">{name}</p>
                <p className="mt-1 font-mono text-sm font-bold text-primary">
                  {formula}
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="hive-card p-6">
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-accent" />
            <h2 className="font-bold">Recent sessions</h2>
          </div>
          {sessions.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground">
              Complete a focus timer and your local session will appear here.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {sessions.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className="flex justify-between rounded-xl bg-muted p-3 text-sm"
                >
                  <span className="font-semibold">{s.subject}</span>
                  <span className="font-mono text-muted-foreground">
                    {s.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FloatingDock() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const move = (event: PointerEvent) => {
    if (!dragging.current) return;
    setPos((current) => ({
      x: current.x + event.clientX - start.current.x,
      y: current.y + event.clientY - start.current.y,
    }));
    start.current = { x: event.clientX, y: event.clientY };
  };
  const up = () => {
    dragging.current = false;
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
  };
  const down = (event: ReactPointerEvent) => {
    dragging.current = true;
    start.current = { x: event.clientX, y: event.clientY };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  const shortcuts = [
    { href: "/focus#timer", label: "Pomodoro timer", icon: AlarmClock },
    {
      href: "/focus#calculator",
      label: "Scientific calculator",
      icon: Calculator,
    },
    { href: "/focus#formulas", label: "Formula reference", icon: Hash },
    {
      href: "/focus#periodic-table",
      label: "Periodic table",
      icon: FlaskConical,
    },
  ];
  return (
    <div
      className="fixed bottom-[5.5rem] right-3 z-30 sm:bottom-6 sm:right-5"
      style={{ transform: `translate(${pos.x}px,${pos.y}px)` }}
      data-testid="floating-focus-dock"
    >
      <div className="hive-shadow w-[min(17rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-border bg-card">
        <div
          onPointerDown={down}
          className="flex touch-none cursor-grab items-center justify-between border-b border-border px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground active:cursor-grabbing"
        >
          <span className="flex items-center gap-1">
            <GripVertical size={13} /> Focus dock
          </span>
          <button
            type="button"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={() => setOpen((value) => !value)}
            className="focus-ring rounded p-1"
            aria-label={open ? "Collapse focus dock" : "Expand focus dock"}
            data-testid="button-dock-toggle"
          >
            {open ? <Minus size={13} /> : <Plus size={13} />}
          </button>
        </div>
        {open && (
          <div className="grid gap-1 p-2">
            {shortcuts.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-muted"
                data-testid={`link-dock-${label.toLowerCase().replaceAll(" ", "-")}`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
            <a
              href="https://music.youtube.com/search?q=lo-fi%20study%20music"
              target="_blank"
              rel="noreferrer"
              className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-muted"
              data-testid="link-dock-lofi"
            >
              <Play size={15} /> Find lo-fi audio on YouTube Music{" "}
              <ArrowRight size={12} />
            </a>
            <Link
              href="/library"
              className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-muted"
              data-testid="link-dock-books"
            >
              <BookOpen size={15} /> Practical previews
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function PeerLearning() {
  const { learner, questions, setQuestions } = useHive();
  const [show, setShow] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const blocked =
    /\b(?:phone|whatsapp|email|contact me|address|nin|tmis)\b|(?:[\w.+-]+@[\w.-]+\.[a-z]{2,})|(?:\+?\d[\d\s().-]{7,}\d)/i;
  const limitedAbuse =
    /\b(?:fuck(?:ing|er)?|shit|bitch(?:es)?|bastard|asshole|omusiru|abasiru|malaaya)\b/i;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim())
      return setNotice("Add a short title and question first.");
    if (blocked.test(`${title} ${body}`))
      return setNotice(
        "Keep this about learning; the demo blocks some contact details and identity terms.",
      );
    if (limitedAbuse.test(`${title} ${body}`))
      return setNotice(
        "Please rephrase respectfully. This is only a small English/Luganda sample list, not a complete safety filter.",
      );
    setQuestions((q) => [
      {
        id: `q-${Date.now()}`,
        grade: learner.grade,
        subject,
        title: title.trim(),
        body: body.trim(),
        createdAt: new Date().toISOString(),
        localVoteCount: 0,
      },
      ...q,
    ]);
    setTitle("");
    setBody("");
    setShow(false);
    setNotice("Saved only in this browser. It was not shared.");
  };
  const visible = questions.filter(
    (q) => filter === "all" || q.subject === filter,
  );
  return (
    <div>
      <PageHeading
        kicker="Peer learning · local prototype"
        title="Ask it out loud, safely."
        description="Draft questions, practise explaining, and vote locally. This prototype does not share posts with classmates, and it has no direct messages."
        action={
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            data-testid="button-new-question"
          >
            <Plus size={17} /> Ask a question
          </button>
        }
      />
      <div className="mb-6 rounded-2xl border border-secondary/50 bg-secondary/20 p-4 text-sm leading-6">
        <div className="flex gap-3">
          <Info size={18} className="mt-0.5 shrink-0 text-primary" />
          <p>
            <strong>Local-only notice:</strong> questions are drafts in this
            browser. They are not visible to classmates. The demo checks for
            some contact details and a small English/Luganda word list; it is
            not complete moderation or child-safety enforcement.
          </p>
        </div>
      </div>
      {show && (
        <form onSubmit={submit} className="hive-card mb-6 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-bold">New local question</h2>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="focus-ring rounded-lg p-2 text-muted-foreground hover:bg-muted"
              aria-label="Close question form"
              data-testid="button-close-question"
            >
              <X size={18} />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="md:col-span-2">
              <span className="mb-2 block text-xs font-bold text-muted-foreground">
                Question title
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you trying to understand?"
                className="focus-ring w-full rounded-lg border border-border bg-background px-3 py-3 text-sm"
                data-testid="input-question-title"
              />
            </label>
            <label>
              <span className="mb-2 block text-xs font-bold text-muted-foreground">
                Subject
              </span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="focus-ring w-full rounded-lg border border-border bg-background px-3 py-3 text-sm"
                data-testid="select-question-subject"
              >
                {subjects.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-bold text-muted-foreground">
              Your working
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Share what you tried, not any personal details."
              className="focus-ring w-full resize-none rounded-lg border border-border bg-background px-3 py-3 text-sm"
              data-testid="textarea-question-body"
            />
          </label>
          {notice && (
            <p
              className="mt-3 text-sm font-semibold text-accent"
              data-testid="status-question-form"
            >
              {notice}
            </p>
          )}
          <button
            type="submit"
            className="focus-ring mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
            data-testid="button-save-question"
          >
            Save local draft
          </button>
        </form>
      )}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="eyebrow">Practice wall</p>
          <h2 className="mt-1 text-xl font-bold">Questions in your browser</h2>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="focus-ring rounded-lg border border-border bg-card px-3 py-2 text-sm"
          data-testid="select-question-filter"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      {visible.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No local questions yet"
          body="Start with the part that made you pause. A good question is already progress."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}
function QuestionCard({ question }: { question: QuestionDraft }) {
  const { setQuestions } = useHive();
  return (
    <article
      className="hive-card p-5"
      data-testid={`card-question-${question.id}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <SoftBadge>
          {question.grade} · {question.subject}
        </SoftBadge>
        <span className="text-xs text-muted-foreground">
          {new Date(question.createdAt).toLocaleDateString()}
        </span>
      </div>
      <h3 className="mt-3 font-bold">{question.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {question.body}
      </p>
      <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
        <button
          type="button"
          onClick={() =>
            setQuestions((prev) =>
              prev.map((item) =>
                item.id === question.id
                  ? { ...item, localVoteCount: item.localVoteCount + 1 }
                  : item,
              ),
            )
          }
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-muted"
          data-testid={`button-vote-question-${question.id}`}
        >
          <ArrowRight size={13} className="-rotate-90" /> Helpful{" "}
          <span className="font-mono">{question.localVoteCount}</span>
        </button>
        <span className="text-[11px] text-muted-foreground">
          stored locally
        </span>
      </div>
    </article>
  );
}

function Science() {
  const cards = [
    {
      title: "Why do leaves look green?",
      text: "Chlorophyll absorbs some colours of light more strongly than others. Sketch a leaf and annotate the light you think is reflected.",
      tag: "Biology",
      icon: FlaskConical,
    },
    {
      title: "The quiet work of friction",
      text: "Friction can warm, slow, and help us grip. Find three examples around your home and sort them by whether friction helps or hinders.",
      tag: "Physics",
      icon: Zap,
    },
    {
      title: "A map is an argument",
      text: "Every map chooses what to show. Compare a road map and a rainfall map: what question is each one helping you ask?",
      tag: "Geography",
      icon: Compass,
    },
  ];
  const [active, setActive] = useState(0);
  return (
    <div>
      <PageHeading
        kicker="Science discovery"
        title="Follow the question."
        description="Short prompts for noticing more in the world around you. No marks, no pressure — just a place to start wondering."
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {cards.map(({ title, text, tag, icon: Icon }, i) => (
          <button
            type="button"
            key={title}
            onClick={() => setActive(i)}
            className={`focus-ring hive-card group p-6 text-left ${active === i ? "border-primary bg-primary text-primary-foreground" : "hover:-translate-y-1"} transition-transform`}
            data-testid={`button-discovery-${i}`}
          >
            <div
              className={`mb-10 flex items-center justify-between ${active === i ? "text-secondary" : "text-accent"}`}
            >
              <Icon size={26} />
              <span
                className={`font-mono text-xs ${active === i ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                0{i + 1}
              </span>
            </div>
            <SoftBadge tone={active === i ? "gold" : "green"}>{tag}</SoftBadge>
            <h2 className="mt-4 text-xl font-bold">{title}</h2>
            <p
              className={`mt-3 text-sm leading-7 ${active === i ? "text-primary-foreground/75" : "text-muted-foreground"}`}
            >
              {text}
            </p>
            <span
              className={`mt-8 inline-flex items-center gap-1 text-xs font-bold ${active === i ? "text-secondary" : "text-primary"}`}
            >
              Open prompt <ArrowRight size={13} />
            </span>
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl bg-secondary/45 p-6 sm:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow">Try this today</p>
            <h2 className="mt-2 text-2xl font-bold">{cards[active].title}</h2>
            <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
              {cards[active].text}
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/20 bg-card text-3xl font-bold text-primary">
            {active + 1}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tutor() {
  return (
    <div>
      <PageHeading
        kicker="Tutor preview"
        title="A tutor is coming later."
        description="We are keeping this honest: there is no connected AI tutor in this demo, so no replies are generated here."
      />
      <div className="mx-auto max-w-3xl">
        <div className="hive-card overflow-hidden">
          <div className="border-b border-border bg-muted/60 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <MessageCircle size={23} />
              </span>
              <div>
                <SoftBadge tone="gold">Not connected</SoftBadge>
                <h2 className="mt-3 text-2xl font-bold">
                  Ask a question when the tutor is ready
                </h2>
                <p className="mt-2 max-w-xl leading-6 text-muted-foreground">
                  This space will only become active after a real AI connection,
                  clear data boundaries, and age-appropriate review. For now,
                  use Peer learning to draft questions locally.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">
                Your question
              </span>
              <textarea
                disabled
                rows={5}
                placeholder="Tutor input is unavailable in demo mode."
                className="w-full resize-none rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm"
                data-testid="textarea-tutor-disabled"
              />
            </label>
            <button
              disabled
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
              data-testid="button-tutor-disabled"
            >
              <Sparkles size={17} /> AI tutor unavailable
            </button>
            <div className="mt-6 flex gap-3 rounded-xl border border-border p-4 text-sm leading-6 text-muted-foreground">
              <ShieldCheck className="mt-0.5 shrink-0 text-primary" size={18} />
              <p>
                No personal information is needed for this preview. Never enter
                your name, school, contact details, NIN, or TMIS information
                here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Classroom() {
  return (
    <div>
      <PageHeading
        kicker="Classroom gateway"
        title="A protected room, not a pretend one."
        description="Live classroom calls are unavailable in this first version. We will only open this door when the safety foundations are real."
      />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="hive-card p-6 sm:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <LockKeyhole size={30} />
          </div>
          <h2 className="mt-6 text-2xl font-bold">Live room locked for now</h2>
          <p className="mt-3 max-w-xl leading-7 text-muted-foreground">
            Authentication, participant isolation, and server-side enforcement
            of a maximum of three people must exist before any live call can be
            offered. This demo has none of those protections connected.
          </p>
          <button
            disabled
            type="button"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground"
            data-testid="button-classroom-disabled"
          >
            <LockKeyhole size={17} /> Live calls unavailable
          </button>
        </div>
        <div className="space-y-3">
          {[
            ["Authentication", "No account or identity is connected."],
            ["Private rooms", "No student-to-student DMs or open room links."],
            [
              "Three-person limit",
              "Would need server-side enforcement before launch.",
            ],
          ].map(([title, body], i) => (
            <div key={title} className="hive-card flex gap-4 p-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/45 font-mono text-sm font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-secondary/50 bg-secondary/20 p-5 text-sm leading-6">
        <div className="flex gap-3">
          <Info className="mt-0.5 shrink-0 text-primary" size={18} />
          <p>
            <strong>Safe by being clear:</strong> there is no live feed, no call
            simulation, and no classmates connected. Use the local Peer learning
            prototype for offline question drafting instead.
          </p>
        </div>
      </div>
    </div>
  );
}

function DebugPanel() {
  const { learner, saved, focus, sessions, questions, debug, setDebug } =
    useHive();
  if (!debug) return null;
  return (
    <div
      className="fixed inset-x-3 bottom-3 z-50 max-h-[75vh] overflow-auto rounded-2xl border-2 border-primary bg-card p-5 shadow-2xl sm:inset-auto sm:bottom-5 sm:right-5 sm:w-[360px]"
      role="dialog"
      aria-label="Developer debug panel"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Developer debug</p>
          <h2 className="mt-1 font-bold">Local demo state</h2>
        </div>
        <button
          type="button"
          onClick={() => setDebug(false)}
          className="focus-ring rounded-lg p-2 hover:bg-muted"
          aria-label="Close debug panel"
          data-testid="button-close-debug"
        >
          <X size={17} />
        </button>
      </div>
      <dl className="mt-5 space-y-3 font-mono text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Storage</dt>
          <dd className="text-right">localStorage only</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Grade</dt>
          <dd>{learner.grade}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Saved books</dt>
          <dd>{saved.length}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Timer</dt>
          <dd>
            {focus.timerMode} · {focus.remainingSeconds}s ·{" "}
            {focus.isRunning ? "running" : "paused"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Sessions</dt>
          <dd>{sessions.length}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Local drafts</dt>
          <dd>{questions.length}</dd>
        </div>
      </dl>
      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Browser-only limitations: no account, server, sharing, authentication,
        live calls, or AI connection.
      </p>
    </div>
  );
}

function AppContent() {
  const [location] = useLocation();
  const [learner, setLearner] = useStored(STORAGE.learner, initialLearner);
  const [saved, setSaved] = useStored(STORAGE.saved, [] as string[]);
  const [focus, setFocus] = useStored(STORAGE.focus, initialFocus);
  const [sessions, setSessions] = useStored(
    STORAGE.sessions,
    [] as StudySession[],
  );
  const [questions, setQuestions] = useStored(
    STORAGE.questions,
    [] as QuestionDraft[],
  );
  const [debug, setDebug] = useState(false);
  useEffect(() => {
    if (!focus.isRunning) return;
    const timer = window.setTimeout(() => {
      if (focus.remainingSeconds > 1) {
        setFocus((previous) => ({
          ...previous,
          remainingSeconds: Math.max(0, previous.remainingSeconds - 1),
        }));
        return;
      }
      const now = new Date();
      if (focus.timerMode === "focus") {
        const completedAt = now.toISOString();
        setSessions((current) => [
          {
            id: `session-${Date.now()}`,
            subject: focus.selectedSubject,
            durationMinutes: focus.durationMinutes,
            completedAt,
          },
          ...current,
        ]);
        const lastSession = sessions[0];
        const lastDate = lastSession ? new Date(lastSession.completedAt) : null;
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        setLearner((current) => {
          const streak = !lastDate
            ? 1
            : lastDate.toDateString() === now.toDateString()
              ? current.streak
              : lastDate.toDateString() === yesterday.toDateString()
                ? current.streak + 1
                : 1;
          return { ...current, xp: current.xp + 25, streak };
        });
      }
      const nextMode = focus.timerMode === "focus" ? "break" : "focus";
      setFocus((previous) => ({
        ...previous,
        timerMode: nextMode,
        remainingSeconds:
          nextMode === "focus" ? previous.durationMinutes * 60 : 5 * 60,
        isRunning: false,
      }));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [
    focus.durationMinutes,
    focus.isRunning,
    focus.remainingSeconds,
    focus.selectedSubject,
    focus.timerMode,
    sessions,
    setFocus,
    setLearner,
    setSessions,
  ]);
  const value = {
    learner,
    setLearner,
    saved,
    setSaved,
    focus,
    setFocus,
    sessions,
    setSessions,
    questions,
    setQuestions,
    debug,
    setDebug,
  };
  return (
    <HiveContext.Provider value={value}>
      <Shell>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/library" component={Library} />
          <Route path="/focus" component={FocusPage} />
          <Route path="/peer-learning" component={PeerLearning} />
          <Route path="/science" component={Science} />
          <Route path="/tutor" component={Tutor} />
          <Route path="/classroom" component={Classroom} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
      {location !== "/focus" && <FloatingDock />}
      <DebugPanel />
    </HiveContext.Provider>
  );
}
const queryClient = new QueryClient();
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;
