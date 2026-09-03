import type { DemoMoment } from "../demoWorkshop/driveDemoWorkshop";
import { FRAMES_PER_SECOND } from "./filmWorkspace";

export type StageLayout =
  "title" | "wallHero" | "wallWithPhone" | "wallWithLaptop" | "outro";

export type BeatSegment = {
  scene: DemoMoment;
  seconds: number;
};

export type StoryboardBeat = {
  name: string;
  layout: StageLayout;
  eyebrow: string;
  caption: string;
  seconds: number;
  gifSeconds: number;
  segments: readonly BeatSegment[];
};

const SCENE_HOLD_MARGIN_MILLISECONDS = 1400;
const UNFILMED_SCENE_HOLD_MILLISECONDS = 400;

export const STORYBOARD: readonly StoryboardBeat[] = [
  {
    name: "title",
    layout: "title",
    eyebrow: "",
    caption: "",
    seconds: 3,
    gifSeconds: 2,
    segments: [],
  },
  {
    name: "join",
    layout: "wallWithPhone",
    eyebrow: "1 · Join",
    caption: "Everyone joins by scanning the QR code on the wall.",
    seconds: 8,
    gifSeconds: 3,
    segments: [
      { scene: "roomFilled", seconds: 4 },
      { scene: "roomFilled", seconds: 4 },
    ],
  },
  {
    name: "quiz",
    layout: "wallHero",
    eyebrow: "2 · Quiz",
    caption: "A warm-up quiz: the room answers, the wall counts along.",
    seconds: 8,
    gifSeconds: 3,
    segments: [
      { scene: "quizTally", seconds: 4 },
      { scene: "quizLearning", seconds: 4 },
    ],
  },
  {
    name: "selection",
    layout: "wallWithPhone",
    eyebrow: "3 · Selection",
    caption: "Everybody picks the ten values that matter most to them.",
    seconds: 8,
    gifSeconds: 3,
    segments: [
      { scene: "valuesPicked", seconds: 4 },
      { scene: "selectionSubmitted", seconds: 4 },
    ],
  },
  {
    name: "results",
    layout: "wallHero",
    eyebrow: "4 · Results",
    caption: "The wall counts up the values the room selected most.",
    seconds: 6,
    gifSeconds: 2.5,
    segments: [{ scene: "selectionResults", seconds: 6 }],
  },
  {
    name: "groups",
    layout: "wallHero",
    eyebrow: "5 · Groups",
    caption: "Participants are dealt into groups named after forest animals.",
    seconds: 8,
    gifSeconds: 3,
    segments: [
      { scene: "groupsForming", seconds: 2 },
      { scene: "groupsFormed", seconds: 6 },
    ],
  },
  {
    name: "groupWork",
    layout: "wallWithLaptop",
    eyebrow: "6 · Group work",
    caption: "Each group turns its values into concrete everyday actions.",
    seconds: 8,
    gifSeconds: 3,
    segments: [
      { scene: "actionsWritten", seconds: 4 },
      { scene: "actionsWritten", seconds: 4 },
    ],
  },
  {
    name: "presentations",
    layout: "wallHero",
    eyebrow: "7 · Presentations",
    caption: "Every group presents its actions to the room.",
    seconds: 6,
    gifSeconds: 2,
    segments: [
      { scene: "actionsPresented", seconds: 2 },
      { scene: "actionsPresented", seconds: 2 },
      { scene: "actionsPresented", seconds: 2 },
    ],
  },
  {
    name: "vote",
    layout: "wallWithPhone",
    eyebrow: "8 · Vote",
    caption: "Everyone spends five votes on the values with the best actions.",
    seconds: 8,
    gifSeconds: 3,
    segments: [
      { scene: "votesInFlight", seconds: 4 },
      { scene: "ballotSubmitted", seconds: 4 },
    ],
  },
  {
    name: "finale",
    layout: "wallHero",
    eyebrow: "9 · Finale",
    caption: "The winning values are revealed one by one, actions first.",
    seconds: 10,
    gifSeconds: 4,
    segments: [
      { scene: "winnersRevealed", seconds: 1.5 },
      { scene: "winnersRevealed", seconds: 1.5 },
      { scene: "winnersRevealed", seconds: 1.5 },
      { scene: "winnersRevealed", seconds: 1.5 },
      { scene: "winnersRevealed", seconds: 4 },
    ],
  },
  {
    name: "outro",
    layout: "outro",
    eyebrow: "",
    caption: "",
    seconds: 4,
    gifSeconds: 2.5,
    segments: [],
  },
];

const filmedSegments: readonly BeatSegment[] = STORYBOARD.flatMap(
  (beat) => beat.segments,
);

export function holdMillisecondsFor(
  moment: DemoMoment,
  occurrence: number,
): number {
  const segment = filmedSegments.filter(
    (candidate) => candidate.scene === moment,
  )[occurrence];
  return segment === undefined
    ? UNFILMED_SCENE_HOLD_MILLISECONDS
    : segment.seconds * 1000 + SCENE_HOLD_MARGIN_MILLISECONDS;
}

export function filmSeconds(): number {
  return STORYBOARD.reduce((total, beat) => total + beat.seconds, 0);
}

function validateStoryboard(): void {
  const names = new Set<string>();
  for (const beat of STORYBOARD) {
    if (names.has(beat.name)) {
      throw new Error(`Two storyboard beats are named "${beat.name}"`);
    }
    names.add(beat.name);

    if (!Number.isInteger(beat.seconds * FRAMES_PER_SECOND)) {
      throw new Error(`Beat "${beat.name}" is not a whole number of frames`);
    }
    if (beat.gifSeconds > beat.seconds) {
      throw new Error(`Beat "${beat.name}" cuts more gif than it has film`);
    }

    const filmedSeconds = beat.segments.reduce(
      (total, segment) => total + segment.seconds,
      0,
    );
    if (beat.segments.length > 0 && filmedSeconds !== beat.seconds) {
      throw new Error(
        `Beat "${beat.name}" lasts ${beat.seconds}s but cuts ${filmedSeconds}s of footage`,
      );
    }
  }
}

validateStoryboard();
