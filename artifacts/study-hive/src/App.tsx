import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  useClerk,
  useUser,
} from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
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
  Redirect,
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
  LogOut,
  LockKeyhole,
  Menu,
  MessageCircle,
  Minus,
  Moon,
  Music2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  TimerReset,
  Trophy,
  Users,
  UserRound,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import ProfilePage from "@/pages/profile";
import SettingsPage from "@/pages/settings";
import {
  defaultStudyHiveProfile,
  readStudyHiveProfile,
} from "@/lib/study-hive-profile";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY.");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "hsl(161 42% 44%)",
    colorForeground: "hsl(42 34% 91%)",
    colorMutedForeground: "hsl(220 12% 68%)",
    colorDanger: "hsl(13 66% 65%)",
    colorBackground: "hsl(224 21% 16%)",
    colorInput: "hsl(225 14% 28%)",
    colorInputForeground: "hsl(42 34% 91%)",
    colorNeutral: "hsl(225 14% 25%)",
    fontFamily: "DM Sans, sans-serif",
    borderRadius: "14px",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox:
      "bg-[hsl(224_21%_16%)] rounded-2xl w-full max-w-[440px] overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[hsl(42_34%_91%)]",
    headerSubtitle: "text-[hsl(220_12%_76%)]",
    socialButtonsBlockButtonText: "text-[hsl(42_34%_91%)]",
    formFieldLabel: "text-[hsl(42_34%_91%)]",
    footerActionLink: "text-[hsl(39_79%_67%)] hover:text-white",
    footerActionText: "text-[hsl(220_12%_76%)]",
    dividerText: "text-[hsl(220_12%_76%)]",
    identityPreviewEditButton: "text-[hsl(39_79%_67%)]",
    formFieldSuccessText: "text-[hsl(161_52%_68%)]",
    alertText: "text-[hsl(42_34%_91%)]",
    logoBox: "h-10 w-10",
    logoImage: "h-full w-full object-contain",
    socialButtonsBlockButton:
      "border border-[hsl(225_14%_32%)] bg-[hsl(225_14%_24%)] hover:bg-[hsl(225_14%_29%)]",
    formButtonPrimary:
      "bg-[hsl(161_42%_44%)] text-[hsl(225_26%_10%)] hover:bg-[hsl(161_42%_50%)]",
    formFieldInput:
      "border-[hsl(225_14%_33%)] bg-[hsl(225_20%_12%)] text-[hsl(42_34%_91%)]",
    footerAction: "border-t border-[hsl(225_14%_28%)]",
    dividerLine: "bg-[hsl(225_14%_32%)]",
    alert: "border-[hsl(13_66%_50%)] bg-[hsl(13_30%_18%)]",
    otpCodeFieldInput:
      "border-[hsl(225_14%_33%)] bg-[hsl(225_20%_12%)] text-[hsl(42_34%_91%)]",
    formFieldRow: "gap-1",
    main: "gap-5",
  },
};

type Grade = "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
type StudyResource = {
  publisher: string;
  title: string;
  format: "Reading" | "Class experiment" | "Interactive" | "Activity";
  description: string;
  url: string;
};
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
  curriculumSource: { title: string; level: string; url: string };
  learningResource: StudyResource;
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
type AmbientTrack = {
  id: string;
  title: string;
  description: string;
  filename: string;
  gradient: string;
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
    title: "Cell detectives: sketching a plant cell",
    objective:
      "Observe a plant-cell sample or image, then make a careful labelled sketch.",
    apparatus: [
      "Prepared onion epidermis slide",
      "Classroom microscope",
      "Science notebook",
    ],
    localAlternatives: [
      "Teacher-provided cell micrograph",
      "Printed plant-cell diagram for labelling",
    ],
    steps: [
      "With a teacher, view a prepared onion slide at low magnification.",
      "Sketch the repeating cell shapes you can actually see.",
      "Label visible structures only; do not guess at details that are unclear.",
      "Compare your sketch with a plant-cell diagram and note one difference.",
    ],
    safetyNote:
      "Use glass slides and microscopes with teacher guidance. Carry slides by the edges and never handle broken glass.",
    curriculumSource: {
      title: "NCDC Biology syllabus",
      level: "Lower Secondary · S1–S4",
      url: "https://ncdc.go.ug/wp-content/uploads/2024/02/Biology_Syllabus_compressed.pdf",
    },
    learningResource: {
      publisher: "OpenStax",
      title: "Eukaryotic cells",
      format: "Reading",
      description:
        "Illustrated background on plant and animal cells, including cell structures.",
      url: "https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells",
    },
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
    curriculumSource: {
      title: "NCDC Chemistry syllabus",
      level: "Lower Secondary · S1–S4",
      url: "https://ncdc.go.ug/wp-content/uploads/2024/03/CHEMISTRY-SYLLABUS_corrected_web-file_compressed.pdf",
    },
    learningResource: {
      publisher: "Royal Society of Chemistry",
      title: "Separating sand and salt by filtering and evaporation",
      format: "Class experiment",
      description:
        "A classroom experiment with a diagram, teaching notes, and safety guidance.",
      url: "https://edu.rsc.org/experiments/separating-sand-and-salt-by-filtering-and-evaporation/386.article",
    },
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
    curriculumSource: {
      title: "NCDC Physics syllabus",
      level: "Lower Secondary · S1–S4",
      url: "https://ncdc.go.ug/wp-content/uploads/2024/02/PHYSICS_Syllabus_compressed.pdf",
    },
    learningResource: {
      publisher: "PhET Interactive Simulations · University of Colorado Boulder",
      title: "Circuit Construction Kit: DC",
      format: "Interactive",
      description:
        "Build low-voltage circuits and explore how a complete loop works.",
      url: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc-virtual-lab",
    },
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
    curriculumSource: {
      title: "NCDC Geography syllabus",
      level: "Lower Secondary · S1–S4",
      url: "https://ncdc.go.ug/wp-content/uploads/2024/02/Georgraphy-Syllabus.pdf",
    },
    learningResource: {
      publisher: "NOAA NESDIS",
      title: "Activity: Measure Rainfall",
      format: "Activity",
      description:
        "A classroom rainfall-measurement activity using simple recycled materials.",
      url: "https://www.nesdis.noaa.gov/about/k-12-education/atmosphere/activity-measure-rainfall",
    },
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
      "Have a teacher or adult prepare the potato strips. Wash hands after handling materials and do not consume the samples.",
    curriculumSource: {
      title: "NCDC Advanced Biology syllabus",
      level: "Advanced Secondary · S5–S6",
      url: "https://ncdc.go.ug/wp-content/uploads/2025/03/Biology.pdf",
    },
    learningResource: {
      publisher: "OpenStax",
      title: "Passive transport",
      format: "Reading",
      description:
        "Explains diffusion and osmosis with examples and a plant-cell connection.",
      url: "https://openstax.org/books/biology-2e/pages/5-2-passive-transport",
    },
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
      "Diluted mild soap solution",
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
    curriculumSource: {
      title: "NCDC Advanced Chemistry syllabus",
      level: "Advanced Secondary · S5–S6",
      url: "https://ncdc.go.ug/wp-content/uploads/2025/03/CHEMISTRY.pdf",
    },
    learningResource: {
      publisher: "PhET Interactive Simulations · University of Colorado Boulder",
      title: "Acid-Base Solutions",
      format: "Interactive",
      description:
        "Explore acid and base strength, particles, and solution concentration.",
      url: "https://phet.colorado.edu/en/simulations/acid-base-solutions",
    },
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
const ambientTracks: AmbientTrack[] = [
  {
    id: "rain-window",
    title: "Rain on the Window",
    description: "Soft piano beneath gentle, irregular rain patter",
    filename: "study-hive-rain-window.mp3",
    gradient: "linear-gradient(145deg, #91b8aa, #3d7168 54%, #1b302e)",
  },
  {
    id: "forest-drizzle",
    title: "Forest Drizzle",
    description: "Light canopy rain with a few distant birds",
    filename: "study-hive-forest-drizzle.mp3",
    gradient: "linear-gradient(145deg, #bdd093, #617a4b 54%, #253c31)",
  },
  {
    id: "quiet-cafe",
    title: "Quiet Café",
    description: "Rain at the window and warm, muted room tone",
    filename: "study-hive-quiet-cafe.mp3",
    gradient: "linear-gradient(145deg, #d6ad80, #93684d 54%, #3e2d28)",
  },
  {
    id: "night-rain",
    title: "Night Rain",
    description: "Low, steady rainfall with slow, mellow keys",
    filename: "study-hive-night-rain.mp3",
    gradient: "linear-gradient(145deg, #9caecb, #526485 54%, #252e43)",
  },
  {
    id: "soft-piano",
    title: "Soft Piano",
    description: "Slow felt-style chords with no percussion",
    filename: "study-hive-soft-piano.mp3",
    gradient: "linear-gradient(145deg, #e1c999, #9a8060 54%, #44382d)",
  },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as T;
    const storageName = key.split(":")[0];
    if (storageName === STORAGE.learner) {
      const learner = stored as LearnerDemo;
      if (learner.xp === 340 && learner.streak === 4)
        return { ...initialLearner, grade: learner.grade } as T;
    }
    if (storageName === STORAGE.focus) {
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
  focusModeOpen: boolean;
  setFocusModeOpen: Dispatch<SetStateAction<boolean>>;
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
  const { user } = useUser();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 bg-primary px-4 py-2 text-[11px] font-semibold tracking-wide text-primary-foreground">
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-secondary" /> STUDY HIVE ·
        {user ? " SIGNED IN" : " YOUR STUDY DESK"}
      </span>
      <span className="opacity-85">
        Study progress is saved on this device.
      </span>
    </div>
  );
}

function AccountControls() {
  const { user } = useUser();
  const { signOut } = useClerk();
  if (!user) return null;
  const profile = readStudyHiveProfile(
    user.unsafeMetadata,
    user.firstName || defaultStudyHiveProfile.displayName,
  );
  return (
    <div className="ml-auto flex items-center gap-2">
      <Link
        href="/profile"
        className="focus-ring flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 hover:bg-card"
        aria-label="Edit your profile"
        data-testid="link-account-profile"
      >
        <span className={`profile-nav-avatar profile-effect-${profile.effect}`}>
          {profile.avatar}
        </span>
        <span className="hidden min-w-0 text-right sm:block">
          <strong className="block max-w-36 truncate text-xs">
            {profile.displayName}
          </strong>
          <small className="block text-[10px] text-muted-foreground">
            My profile
          </small>
        </span>
      </Link>
      <button
        type="button"
        onClick={() => void signOut({ redirectUrl: basePath || "/" })}
        className="focus-ring rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
        aria-label="Sign out"
        title="Sign out"
        data-testid="button-sign-out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/library", label: "Guides", icon: LibraryBig },
  { href: "/focus", label: "Focus tools", icon: Focus },
  { href: "/peer-learning", label: "Peer learning", icon: Users },
  { href: "/science", label: "Science discovery", icon: Compass },
  { href: "/tutor", label: "Tutor preview", icon: MessageCircle },
  { href: "/classroom", label: "Classroom gateway", icon: LockKeyhole },
  { href: "/profile", label: "My profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings2 },
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
        <aside className="hidden w-64 shrink-0 border-r border-border/80 bg-[hsl(224_22%_14%/.88)] px-4 py-6 lg:block">
          <Link
            href="/dashboard"
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
            Your study activity is saved on this device. Peer profiles and live
            rooms are not shared in this build.
          </p>
        </aside>
        <main className="min-w-0 flex-1 pb-[12rem] lg:pb-24">
          <header className="flex items-center justify-between px-4 py-4 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 lg:hidden">
              <Link
                href="/dashboard"
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
            <AccountControls />
            <button
              type="button"
              onClick={() => setDebug((v) => !v)}
              className="focus-ring ml-auto hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground sm:flex"
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
          className="fixed bottom-[10rem] right-2 z-30 w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-border bg-card p-2 shadow-xl lg:hidden"
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
  const { learner, setLearner, saved, sessions, setFocusModeOpen } = useHive();
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
      <div className="hero-panel relative mb-8 overflow-hidden rounded-[1.6rem] px-6 py-8 text-foreground hive-shadow sm:px-10 sm:py-10">
        <div className="relative z-10 max-w-2xl">
          <p className="eyebrow text-secondary">
            GOOD TO SEE YOU · {learner.grade}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            Big ideas start
            <br className="hidden sm:block" /> with curiosity.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-foreground/80 sm:text-base">
            Open your notebook, try something new, and make your next study
            session count.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setFocusModeOpen(true)}
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-bold text-secondary-foreground hover:brightness-105"
              data-testid="button-start-focus"
            >
              Enter focus room <ArrowRight size={16} />
            </button>
            <Link
              href="/library"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-foreground/25 px-4 py-3 text-sm font-bold text-foreground hover:bg-foreground/10"
              data-testid="link-open-library"
            >
              Browse class guides <BookOpen size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-doodle mt-7 flex items-center justify-center gap-5 sm:absolute sm:bottom-7 sm:right-10 sm:mt-0" aria-hidden="true">
          <svg viewBox="0 0 240 190" className="h-44 w-56 overflow-visible sm:h-52 sm:w-64" fill="none">
            <path d="M60 157c18-35 35-69 53-92 3-4 8-4 11 0 19 25 37 58 55 93-20-2-37 1-56 2-22 0-41-5-63-3Z" fill="hsl(25 45% 37% / .72)" />
            <path d="M76 146c18-5 30-2 42 0 14 3 27 1 42-2l10 13c-23-2-37 4-59 3-14 0-26-3-43-1Z" fill="hsl(13 48% 48% / .66)" />
            <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity=".82">
              <path d="M18 162c23-5 41 5 64 1 27-5 44 4 69 1 22-3 40 2 60-2" stroke="hsl(39 67% 70%)" />
              <path d="M48 160c18-36 38-75 62-102 5-6 13-6 19 0 25 29 45 68 65 103" stroke="hsl(31 58% 72%)" />
              <path d="M104 60c9-7 24-8 34-1m-40 3c14 4 31 4 45-1" stroke="hsl(220 30% 87%)" />
              <path d="M72 125c11-5 21 2 30-2m-42 24c14-4 21 4 33 1m65-22c-11-4-20 2-29 5m45 12c-11-2-18 4-27 3" stroke="hsl(13 55% 70%)" />
              <path d="M116 50c-11-5-10-13-2-19 6-5 5-10 1-15m8 34c13-3 18-12 11-20m-28 13c-9-5-8-13 0-19" stroke="hsl(161 38% 72%)" />
              <path d="M26 83h24l10 9m-10-15 10 15-13-1m132 2 21-15m-9 0 9 0-2 9" stroke="hsl(161 38% 70%)" />
              <path d="M29 154l-5-11m13 12 1-14m170 11 7-12m-18 13 1-10" stroke="hsl(105 39% 67%)" />
              <path d="M122 62c-1 10 6 13 5 22-1 8 5 12 3 20-2 9 5 15 8 23 2 6 2 12 7 19" stroke="hsl(13 76% 70%)" strokeWidth="4" />
              <circle cx="87" cy="52" r="2" fill="hsl(39 83% 74%)" stroke="none" />
              <circle cx="155" cy="47" r="2.5" fill="hsl(161 48% 70%)" stroke="none" />
              <circle cx="171" cy="62" r="1.8" fill="hsl(13 72% 73%)" stroke="none" />
            </g>
            <path d="M119 65c3 10 0 13 6 20 5 6 0 13 4 19 3 7 8 13 9 21-5-5-11-7-15-13-5-7-3-13-6-20-3-8-8-13-5-21Z" fill="hsl(13 76% 63% / .65)" />
            <text x="13" y="77" fill="hsl(220 30% 87%)" fontFamily="monospace" fontSize="8" opacity=".9">ASH CLOUD</text>
            <text x="171" y="112" fill="hsl(39 83% 74%)" fontFamily="monospace" fontSize="8" opacity=".95">LAVA</text>
            <path d="M167 116l-17 8" stroke="hsl(39 83% 74%)" strokeWidth="1.2" strokeLinecap="round" opacity=".9" />
          </svg>
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
            sub: "Saved on this device",
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
                Class guides for {learner.grade}
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
            NCDC syllabus linked · study guide
          </span>
          <button
            type="button"
            ref={triggerRef}
            onClick={() => setOpen(true)}
            className="focus-ring inline-flex items-center gap-1 text-xs font-bold text-primary"
            data-testid={`button-open-book-${book.id}`}
          >
            Open guide <ArrowRight size={13} />
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
                aria-label="Close guide preview"
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
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a
                href={book.curriculumSource.url}
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded-2xl border border-border bg-muted/60 p-4 transition-colors hover:bg-muted"
                data-testid={`link-ncdc-syllabus-${book.id}`}
              >
                <span className="eyebrow">Official syllabus reference</span>
                <span className="mt-2 block font-bold">
                  {book.curriculumSource.title}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {book.curriculumSource.level} · Open NCDC PDF
                </span>
              </a>
              <a
                href={book.learningResource.url}
                target="_blank"
                rel="noreferrer"
                className="focus-ring rounded-2xl border border-border bg-muted/60 p-4 transition-colors hover:bg-muted"
                data-testid={`link-learning-resource-${book.id}`}
              >
                <span className="eyebrow">
                  {book.learningResource.format} · {book.learningResource.publisher}
                </span>
                <span className="mt-2 block font-bold">
                  {book.learningResource.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {book.learningResource.description}
                </span>
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <p className="max-w-sm text-xs leading-5 text-muted-foreground">
                Follow your teacher’s method and safety instructions for any
                practical work.
              </p>
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
      (
        b.title +
        " " +
        b.objective +
        " " +
        b.subject +
        " " +
        b.curriculumSource.title +
        " " +
        b.learningResource.title
      )
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <div>
      <PageHeading
        kicker="NCDC class guides"
        title="Your class, your next experiment."
        description="Browse practical study guides by Senior 1–Senior 6 and subject. Each guide links to its official NCDC subject syllabus and a trusted learning resource."
        action={
          <SoftBadge tone="gold">
            <Info size={13} className="mr-1" /> Official references linked
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
            placeholder="Search guides, topics, or resources"
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
          <strong className="text-foreground">{filtered.length}</strong> guide
          {filtered.length === 1 ? "" : "s"} found · showing unlocked levels
          through <strong className="text-primary">{learner.grade}</strong>
        </p>
        <SoftBadge tone="muted">{saved.length} saved locally</SoftBadge>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No guides match that search"
          body="Try a broader subject, class, or a shorter search phrase."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function TimerCard() {
  const { focus, setFocus, setFocusModeOpen } = useHive();
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
          onClick={() => setFocusModeOpen(true)}
          className="focus-ring inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
          data-testid="button-timer-toggle"
        >
          <Play size={17} />{" "}
          {focus.isRunning ? "Open current session" : "Enter focus room"}
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

function FloatingDock({ onOpenPlayer }: { onOpenPlayer: () => void }) {
  const { setFocusModeOpen } = useHive();
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
      className="fixed bottom-[10rem] right-3 z-30 hidden md:block sm:bottom-40 sm:right-5 lg:bottom-28"
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
                onClick={(event) => {
                  if (href !== "/focus#timer") return;
                  event.preventDefault();
                  setOpen(false);
                  setFocusModeOpen(true);
                }}
                className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-muted"
                data-testid={`link-dock-${label.toLowerCase().replaceAll(" ", "-")}`}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenPlayer();
              }}
              className="focus-ring flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-primary hover:bg-muted"
              data-testid="button-open-lofi-player"
            >
              <Music2 size={15} /> Open Study Hive music player{" "}
              <ArrowRight size={12} />
            </button>
            <Link
              href="/library"
              className="focus-ring flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary hover:bg-muted"
              data-testid="link-dock-books"
            >
              <BookOpen size={15} /> Class guides
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const wholeSeconds = Math.floor(seconds);
  return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function MusicTrackChoices({
  selectedTrackId,
  onSelect,
  layout = "list",
}: {
  selectedTrackId: string;
  onSelect: (trackId: string) => void;
  layout?: "list" | "grid";
}) {
  return (
    <div
      className={
        layout === "grid"
          ? "grid gap-2 sm:grid-cols-2"
          : "grid max-h-56 gap-2 overflow-y-auto pr-1"
      }
      data-testid="list-ambient-tracks"
    >
      {ambientTracks.map((track) => {
        const selected = selectedTrackId === track.id;
        return (
          <button
            key={track.id}
            type="button"
            onClick={() => onSelect(track.id)}
            aria-pressed={selected}
            className={`focus-ring flex min-w-0 items-center gap-3 rounded-xl border p-2 text-left transition-colors ${
              selected
                ? "border-[#d6ad72]/80 bg-white/[.09]"
                : "border-white/10 bg-white/[.035] hover:bg-white/[.08]"
            }`}
            data-testid={`button-select-track-${track.id}`}
          >
            <span
              className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg text-white"
              style={{ background: track.gradient }}
              aria-hidden="true"
            >
              <span className="absolute inset-2 rounded-full border border-white/25" />
              <Music2 className="relative z-10" size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-white">
                {track.title}
              </span>
              <span className="mt-0.5 block text-[10px] leading-4 text-white/55">
                {track.description}
              </span>
            </span>
            {selected && <Check size={15} className="shrink-0 text-[#d6ad72]" />}
          </button>
        );
      })}
    </div>
  );
}

function StudyMusicPlayer({
  expanded,
  setExpanded,
}: {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { focus, setFocus, focusModeOpen, setFocusModeOpen } = useHive();
  const [selectedTrackId, setSelectedTrackId] = useState(ambientTracks[0].id);
  const currentTrack =
    ambientTracks.find((track) => track.id === selectedTrackId) ??
    ambientTracks[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(0.4);
  const [error, setError] = useState("");
  const sessionDuration =
    (focus.timerMode === "focus" ? focus.durationMinutes : 5) * 60;
  const sessionProgress = `${Math.max(
    0,
    Math.min(
      100,
      ((sessionDuration - focus.remainingSeconds) / sessionDuration) * 100,
    ),
  )}%`;
  const sessionMinutes = String(
    Math.floor(focus.remainingSeconds / 60),
  ).padStart(2, "0");
  const sessionSeconds = String(focus.remainingSeconds % 60).padStart(2, "0");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = `${import.meta.env.BASE_URL}audio/${currentTrack.filename}`;
    audio.load();
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!focusModeOpen) return;
    setExpanded(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [focusModeOpen, setExpanded]);

  useEffect(() => {
    if (!expanded && !focusModeOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (focusModeOpen) setFocusModeOpen(false);
      else setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, focusModeOpen, setExpanded, setFocusModeOpen]);

  const selectTrack = (trackId: string) => {
    if (trackId === selectedTrackId) return;
    const nextTrack = ambientTracks.find((track) => track.id === trackId);
    if (!nextTrack) return;
    const audio = audioRef.current;
    const shouldResume = Boolean(audio && !audio.paused);
    if (audio) {
      audio.pause();
      audio.src = `${import.meta.env.BASE_URL}audio/${nextTrack.filename}`;
      audio.load();
    }
    setSelectedTrackId(trackId);
    setCurrentTime(0);
    setDuration(60);
    setError("");
    if (shouldResume && audio) {
      void audio.play().catch(() => {
        setError("Playback did not start. Press play to try again.");
      });
    }
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
        setError("");
      } catch {
        setError("Playback did not start. Try pressing play again.");
      }
    } else {
      audio.pause();
    }
  };

  const toggleFocusTimer = () => {
    if (!focus.isRunning && audioRef.current?.paused) {
      void togglePlayback();
    }
    setFocus((current) => ({ ...current, isRunning: !current.isRunning }));
  };

  const seek = (value: string) => {
    const time = Number(value);
    if (!Number.isFinite(time) || !audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const renderProgress = (
    surface: "mobile" | "desktop" | "expanded" | "focus",
  ) => (
    <input
      type="range"
      min={0}
      max={duration || 60}
      step={0.1}
      value={Math.min(currentTime, duration || 60)}
      onChange={(event) => seek(event.target.value)}
      aria-label={`Seek through ${currentTrack.title} (${surface} player)`}
      className="h-1.5 w-full cursor-pointer accent-[#d6ad72]"
      data-testid={`input-lofi-seek-${surface}`}
    />
  );

  const renderPlayButton = (
    surface: "mobile" | "desktop" | "expanded" | "focus",
  ) => (
    <button
      type="button"
      onClick={togglePlayback}
      aria-label={isPlaying ? "Pause lo-fi music" : "Play lo-fi music"}
      className="focus-ring flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d6ad72] text-[#1b211c] transition-transform hover:scale-105"
      data-testid={`button-lofi-play-${surface}`}
    >
      {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
    </button>
  );

  const renderCoverArt = (surface: "mobile" | "desktop") => (
    <div
      className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_72%_25%,#9ab879_0,transparent_36%),linear-gradient(140deg,#45674b,#263a32_54%,#17201d)] text-white"
      role="img"
      aria-label={`${currentTrack.title} cover artwork`}
      data-testid={`img-lofi-cover-${surface}`}
      style={{ background: currentTrack.gradient }}
    >
      <div className="absolute inset-2 rounded-full border border-white/25" />
      <div className="absolute inset-4 rounded-full border border-white/20" />
      <Music2 className="relative z-10" size={19} />
    </div>
  );

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        loop
        onLoadedMetadata={(event) =>
          setDuration(event.currentTarget.duration || 60)
        }
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setError(`${currentTrack.title} could not be loaded.`)}
        data-testid="audio-lofi-track"
      />

      {focusModeOpen && (
        <div
          className="focus-room fixed inset-0 z-[90] overflow-y-auto text-white"
          role="dialog"
          aria-modal="true"
          aria-labelledby="focus-session-title"
          data-testid="focus-session-overlay"
        >
          <div className="mx-auto min-h-dvh w-full max-w-[1440px] px-4 pb-6 pt-4 sm:px-8 sm:pb-10 sm:pt-7">
            <header className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#d6ad72] text-[#1b211c]">
                  <Moon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ab879]">
                    Study Hive · focus room
                  </p>
                  <p className="text-xs text-white/55">
                    Close with X to return; your timer and ambience keep their state.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFocusModeOpen(false)}
                className="focus-ring flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:h-12 sm:w-12"
                aria-label="Exit focus room"
                title="Exit focus room"
                data-testid="button-exit-focus-session"
              >
                <X size={20} />
              </button>
            </header>

            <main className="grid gap-4 py-5 sm:gap-6 sm:py-8 lg:grid-cols-[0.92fr_1.08fr]">
              <section className="focus-timer-panel relative overflow-hidden rounded-[1.75rem] border border-white/10 p-5 shadow-2xl sm:p-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ab879]">
                  Pomodoro · {focus.timerMode === "focus" ? "focus block" : "short break"}
                </p>
                <h1
                  id="focus-session-title"
                  className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl"
                >
                  {focus.timerMode === "focus"
                    ? `${focus.selectedSubject} focus`
                    : "A moment to reset"}
                </h1>
                <p className="mt-2 text-sm leading-6 text-white/60">
                  {focus.timerMode === "focus"
                    ? "One clear task, a calm soundtrack, and a little space to think."
                    : "Your focus block is complete. Rest your eyes, then resume when ready."}
                </p>

                <div className="focus-window-scene my-5 sm:my-6" aria-hidden="true">
                  <div className="focus-window">
                    <span className="window-sun" />
                    <span className="window-hills" />
                    <span className="window-canopy" />
                    <span className="window-rain" />
                    <span className="window-frame" />
                  </div>
                  <div className="window-sill">
                    <span className="window-mug" />
                    <span className="window-notebook" />
                  </div>
                  <span className="window-caption">A little rain, a little room to think</span>
                </div>

                <div className="my-6 flex justify-center sm:my-8">
                  <div
                    className="timer-ring flex h-60 w-60 items-center justify-center rounded-full sm:h-72 sm:w-72"
                    style={{ "--progress": sessionProgress } as CSSProperties}
                  >
                    <div className="flex h-48 w-48 flex-col items-center justify-center rounded-full border border-white/5 bg-[#101712] sm:h-60 sm:w-60">
                      <span className="font-mono text-6xl font-bold tracking-tight sm:text-7xl">
                        {sessionMinutes}:{sessionSeconds}
                      </span>
                      <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">
                        {focus.timerMode === "focus" ? "focus" : "break"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={toggleFocusTimer}
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d6ad72] px-5 py-3.5 text-sm font-bold text-[#1b211c] transition-transform hover:scale-[1.01] sm:py-4"
                  data-testid="button-focus-session-toggle"
                >
                  {focus.isRunning ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                  {focus.isRunning
                    ? "Pause timer"
                    : focus.timerMode === "break"
                      ? "Start 5-minute break"
                      : focus.remainingSeconds < sessionDuration
                        ? "Resume focus session"
                        : "Start focus session"}
                </button>
                <p
                  className="mt-3 min-h-5 text-center text-xs text-white/50"
                  role="status"
                  aria-live="polite"
                  data-testid="status-focus-session"
                >
                  {focus.isRunning
                    ? "Timer running · close this room any time; your session continues."
                    : "Starting or resuming also plays your selected sound."}
                </p>
              </section>

              <section className="focus-sound-panel rounded-[1.75rem] border border-white/10 p-5 shadow-2xl sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ab879]">
                      Sound for this session
                    </p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                      {currentTrack.title}
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-white/55">
                      {currentTrack.description}
                    </p>
                  </div>
                  <div
                    className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white sm:h-20 sm:w-20"
                    style={{ background: currentTrack.gradient }}
                    aria-label={`${currentTrack.title} cover artwork`}
                    role="img"
                    data-testid="img-focus-track-cover"
                  >
                    <div className="absolute inset-2 rounded-full border border-white/25" />
                    <Music2 className="relative z-10" size={27} />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-3 text-[10px] font-mono text-white/50">
                  <span className="w-8 text-right">{formatAudioTime(currentTime)}</span>
                  {renderProgress("focus")}
                  <span className="w-8">{formatAudioTime(duration)}</span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (audioRef.current) audioRef.current.currentTime = 0;
                        setCurrentTime(0);
                      }}
                      aria-label="Restart ambient track"
                      className="focus-ring rounded-full p-2 text-white/65 hover:bg-white/10 hover:text-white"
                      data-testid="button-focus-track-restart"
                    >
                      <RotateCcw size={17} />
                    </button>
                    {renderPlayButton("focus")}
                    <span className="flex items-center gap-1 text-[10px] text-white/55">
                      <RotateCcw size={12} /> Loops
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-white/60">
                    <Volume2 size={15} />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={volume}
                      onChange={(event) =>
                        setVolume(Number(event.target.value))
                      }
                      aria-label="Focus music volume"
                      className="h-1.5 w-20 cursor-pointer accent-[#d6ad72] sm:w-28"
                      data-testid="input-focus-music-volume"
                    />
                  </label>
                </div>

                <div className="mt-5 border-t border-white/10 pt-4">
                  <h3 className="mb-3 text-xs font-bold text-white/80">
                    Choose your ambience
                  </h3>
                  <MusicTrackChoices
                    selectedTrackId={selectedTrackId}
                    onSelect={selectTrack}
                    layout="grid"
                  />
                </div>
                {error && (
                  <p
                    className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-[#ffaaa4]"
                    role="status"
                    data-testid="status-focus-audio-error"
                  >
                    {error}
                  </p>
                )}
              </section>
            </main>
          </div>
        </div>
      )}

      {expanded && !focusModeOpen && (
        <section
          className="fixed bottom-[10rem] left-3 right-3 z-40 mx-auto max-h-[calc(100dvh-12rem)] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#151a16] p-5 text-white shadow-2xl sm:left-auto sm:right-5 sm:bottom-[9.5rem] sm:mx-0 sm:p-6 lg:bottom-24"
          aria-labelledby="lofi-expanded-title"
          data-testid="panel-lofi-expanded"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{ background: currentTrack.gradient }}
              >
                <div className="absolute inset-3 rounded-full border border-white/25" />
                <div className="absolute inset-6 rounded-full border border-white/20" />
                <Music2 size={28} className="relative z-10 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9ab879]">
                  Study Hive · ambient library
                </p>
                <h2
                  id="lofi-expanded-title"
                  className="mt-1 truncate text-xl font-bold"
                >
                  {currentTrack.title}
                </h2>
                <p className="mt-1 text-xs text-white/60">
                  {currentTrack.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              aria-label="Collapse music player"
              className="focus-ring rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
              data-testid="button-collapse-lofi"
            >
              <Minus size={17} />
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 text-[10px] font-mono text-white/50">
            <span className="w-8 text-right">{formatAudioTime(currentTime)}</span>
            {renderProgress("expanded")}
            <span className="w-8">{formatAudioTime(duration)}</span>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
              Choose a sound
            </p>
            <MusicTrackChoices
              selectedTrackId={selectedTrackId}
              onSelect={selectTrack}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }}
              aria-label="Restart lo-fi track"
              className="focus-ring rounded-full p-2 text-white/60 hover:text-white"
              data-testid="button-lofi-restart-expanded"
            >
              <RotateCcw size={18} />
            </button>
            {renderPlayButton("expanded")}
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <RotateCcw size={13} /> Loop on
            </span>
          </div>

          <label className="mt-5 flex items-center gap-3 text-xs text-white/65">
            <Volume2 size={16} />
            <span className="w-12">Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label="Music volume"
              className="h-1.5 flex-1 cursor-pointer accent-[#d6ad72]"
              data-testid="input-lofi-volume-expanded"
            />
            <span className="w-9 text-right">{Math.round(volume * 100)}%</span>
          </label>
          {error && (
            <p
              className="mt-4 rounded-lg bg-white/5 px-3 py-2 text-xs text-[#f2a6a0]"
              role="status"
              data-testid="status-lofi-error-expanded"
            >
              {error}
            </p>
          )}
          <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/45">
            Five original soundscapes are bundled in Study Hive. They loop
            automatically and need no music account.
          </p>
        </section>
      )}

      <section
        className="fixed bottom-20 left-0 right-0 z-30 border-t border-white/10 bg-[#111612] text-white shadow-[0_-12px_35px_rgba(0,0,0,.16)] lg:bottom-0 lg:left-64"
        aria-label="Study Hive music player"
        aria-hidden={focusModeOpen}
        data-testid="in-app-lofi-player"
      >
        <div className="mx-auto max-w-[1600px] px-3 py-2 sm:px-5 lg:px-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 md:hidden">
            {renderCoverArt("mobile")}
            <div className="min-w-0">
              <p className="truncate text-sm font-bold" data-testid="text-lofi-title-mobile">
                {currentTrack.title}
              </p>
              <p className="truncate text-[10px] text-white/55">
                Study Hive · ambient
              </p>
              <div className="mt-1">{renderProgress("mobile")}</div>
            </div>
            {renderPlayButton("mobile")}
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              aria-label={expanded ? "Collapse music player" : "Expand music player"}
              className="focus-ring rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
              data-testid="button-expand-lofi-mobile"
            >
              {expanded ? <Minus size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <div className="hidden items-center gap-5 md:grid md:grid-cols-[minmax(12rem,1fr)_minmax(17rem,1.4fr)_minmax(10rem,1fr)]">
            <div className="flex min-w-0 items-center gap-3">
              {renderCoverArt("desktop")}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold" data-testid="text-lofi-title-desktop">
                  {currentTrack.title}
                </p>
                <p className="truncate text-xs text-white/55">
                  Study Hive · ambient
                </p>
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-1 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) audioRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }}
                  aria-label="Restart lo-fi track"
                  className="focus-ring rounded-full p-1.5 text-white/60 hover:text-white"
                  data-testid="button-lofi-restart-desktop"
                >
                  <RotateCcw size={15} />
                </button>
                {renderPlayButton("desktop")}
                <span className="text-[10px] text-white/55">LOOP</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/50">
                <span>{formatAudioTime(currentTime)}</span>
                {renderProgress("desktop")}
                <span>{formatAudioTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Volume2 size={16} className="text-white/60" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                aria-label="Music volume"
                className="h-1.5 w-20 cursor-pointer accent-[#d6ad72]"
                data-testid="input-lofi-volume-desktop"
              />
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse music player" : "Expand music player"}
                className="focus-ring rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                data-testid="button-expand-lofi"
              >
                {expanded ? <Minus size={16} /> : <Plus size={16} />}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
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
            Sign-in is available, but private room membership, participant
            controls, and live-call safety checks are not connected. Calls stay
            off until those protections are in place.
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
            [
              "Account sign-in",
              "Study Hive accounts are available; classroom-only permissions are not wired.",
            ],
            [
              "Private rooms",
              "Room membership checks and protected invite links are not connected.",
            ],
            [
              "Call safety",
              "No Zoom room or real-time moderation system is connected.",
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
            <strong>Safe by being clear:</strong> there is no live feed, call
            simulation, or participant monitoring. Calls remain unavailable
            until joining rules, notice, consent, and moderation safeguards are
            defined.
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
        Account sign-in is enabled. Study progress remains local to this device
        and is not synced between devices; live calls and AI moderation are not
        connected.
      </p>
    </div>
  );
}

function AppContent({ userId }: { userId: string }) {
  const [location] = useLocation();
  const [learner, setLearner] = useStored(
    `${STORAGE.learner}:${userId}`,
    initialLearner,
  );
  const [saved, setSaved] = useStored(`${STORAGE.saved}:${userId}`, [] as string[]);
  const [focus, setFocus] = useStored(
    `${STORAGE.focus}:${userId}`,
    initialFocus,
  );
  const [sessions, setSessions] = useStored(
    `${STORAGE.sessions}:${userId}`,
    [] as StudySession[],
  );
  const [questions, setQuestions] = useStored(
    `${STORAGE.questions}:${userId}`,
    [] as QuestionDraft[],
  );
  const [debug, setDebug] = useState(false);
  const [musicExpanded, setMusicExpanded] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
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
    focusModeOpen,
    setFocusModeOpen,
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
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/library" component={Library} />
          <Route path="/focus" component={FocusPage} />
          <Route path="/peer-learning" component={PeerLearning} />
          <Route path="/science" component={Science} />
          <Route path="/tutor" component={Tutor} />
          <Route path="/classroom" component={Classroom} />
          <Route path="/profile" component={ProfilePage} />
          <Route path="/settings" component={SettingsPage} />
          <Route component={NotFound} />
        </Switch>
      </Shell>
      {location !== "/focus" && (
        <FloatingDock onOpenPlayer={() => setMusicExpanded(true)} />
      )}
      <StudyMusicPlayer
        expanded={musicExpanded}
        setExpanded={setMusicExpanded}
      />
      <DebugPanel />
    </HiveContext.Provider>
  );
}
const queryClient = new QueryClient();

function LoadingScreen() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 text-sm text-muted-foreground">
      Preparing your Study Hive…
    </main>
  );
}

function PublicHome() {
  return (
    <main className="hive-shell relative min-h-[100dvh] overflow-hidden px-5 py-6 sm:px-10">
      <div className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <Beaker size={23} />
          </span>
          <span>
            <strong className="block text-lg tracking-tight">Study Hive</strong>
            <small className="eyebrow">learn together</small>
          </span>
        </Link>
        <div className="hidden items-center gap-2 sm:flex">
          <Link
            href="/sign-in"
            className="focus-ring rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-card"
            data-testid="link-sign-in"
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="focus-ring rounded-xl bg-secondary px-4 py-2.5 text-sm font-bold text-secondary-foreground"
            data-testid="link-sign-up"
          >
            Create account
          </Link>
        </div>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100dvh-110px)] max-w-6xl items-center gap-12 py-14 lg:grid-cols-[1.1fr_.9fr]">
        <div className="max-w-2xl">
          <p className="eyebrow">A calmer way to make progress</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Your next good
            <span className="block text-primary">study session</span>
            starts here.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Save your guides, focus with a timer, and keep your learning
            organized in one warm, quiet space.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 font-bold text-secondary-foreground"
              data-testid="button-home-create-account"
            >
              Create your account <ArrowRight size={17} />
            </Link>
            <Link
              href="/sign-in"
              className="focus-ring rounded-xl border border-border bg-card/70 px-5 py-3 font-semibold hover:bg-card"
              data-testid="button-home-sign-in"
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Sign in with email and password or a social provider enabled for
            Study Hive.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-5 rounded-[2rem] bg-primary/10 blur-2xl" />
          <div className="hive-card relative rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="eyebrow">Your study desk</span>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Ready when you are
              </span>
            </div>
            <div className="mt-8 rounded-2xl border border-border bg-background/70 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/20 text-2xl">
                  🌱
                </span>
                <div>
                  <p className="font-bold">One small step</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A little focus adds up.
                  </p>
                </div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 rounded-full bg-primary" />
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                <span>Focus session</span>
                <span>25 min</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <BookOpen size={18} className="text-primary" />
                <p className="mt-3 text-sm font-semibold">Study guides</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <Sparkles size={18} className="text-secondary" />
                <p className="mt-3 text-sm font-semibold">Small wins</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  return isSignedIn ? <Redirect to="/dashboard" /> : <PublicHome />;
}

function ProtectedApp() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn || !user) return <Redirect to="/" />;
  return <AppContent key={user.id} userId={user.id} />;
}

function SignInPage() {
  return (
    <main className="hive-shell min-h-[100dvh] px-4 py-6 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Beaker size={21} />
          </span>
          <strong className="text-lg">Study Hive</strong>
        </Link>
        <Link
          href="/sign-up"
          className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-card"
        >
          Create account
        </Link>
      </header>
      <div className="mx-auto grid max-w-6xl items-center gap-8 py-10 lg:min-h-[calc(100dvh-96px)] lg:grid-cols-[1fr_440px]">
        <div className="hidden max-w-lg lg:block">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-tight">
            Pick up where
            <span className="block text-primary">you left off.</span>
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Your profile and study space are waiting. Use the password reset
            link in the sign-in form if you need a new password.
          </p>
        </div>
        <div className="hive-card mx-auto w-full max-w-[440px] rounded-2xl p-3 sm:p-5">
          <SignIn
            routing="path"
            path={`${basePath}/sign-in`}
            signUpUrl={`${basePath}/sign-up`}
            forceRedirectUrl={`${basePath}/dashboard`}
          />
        </div>
      </div>
    </main>
  );
}

function SignUpPage() {
  return (
    <main className="hive-shell min-h-[100dvh] px-4 py-6 sm:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Beaker size={21} />
          </span>
          <strong className="text-lg">Study Hive</strong>
        </Link>
        <Link
          href="/sign-in"
          className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-card"
        >
          Sign in
        </Link>
      </header>
      <div className="mx-auto grid max-w-6xl items-center gap-8 py-10 lg:min-h-[calc(100dvh-96px)] lg:grid-cols-[1fr_440px]">
        <div className="hidden max-w-lg lg:block">
          <p className="eyebrow">Make room to learn</p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-tight">
            Start with one
            <span className="block text-primary">small step.</span>
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            Create an account to personalize your profile and keep your Study
            Hive space ready for the next session.
          </p>
        </div>
        <div className="hive-card mx-auto w-full max-w-[440px] rounded-2xl p-3 sm:p-5">
          <SignUp
            routing="path"
            path={`${basePath}/sign-up`}
            signInUrl={`${basePath}/sign-in`}
            forceRedirectUrl={`${basePath}/dashboard`}
          />
        </div>
      </div>
    </main>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your Study Hive account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Get started with your own Study Hive profile",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClerkQueryClientCacheInvalidator />
      <Switch>
        <Route path="/" component={HomeRedirect} />
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route component={ProtectedApp} />
      </Switch>
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <ErrorBoundary>
            <ClerkProviderWithRoutes />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
export default App;
