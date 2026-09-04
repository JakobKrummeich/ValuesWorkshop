const firstLetterCode = "A".charCodeAt(0);

export function answerLetterOf(answerIndex: number): string {
  return String.fromCharCode(firstLetterCode + answerIndex);
}
