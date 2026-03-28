import rs from "text-readability";
import { ReadingLevel, SimplifiedVariant } from "./types";

export function scoreVariants(raw: {
  grade3: string;
  grade6: string;
  grade9: string;
}): SimplifiedVariant[] {
  const levels: { level: ReadingLevel; text: string }[] = [
    { level: "grade3", text: raw.grade3 },
    { level: "grade6", text: raw.grade6 },
    { level: "grade9", text: raw.grade9 },
  ];

  return levels.map(({ level, text }) => ({
    level,
    text,
    fkScore: rs.fleschKincaidGrade(text) as number,
  }));
}
