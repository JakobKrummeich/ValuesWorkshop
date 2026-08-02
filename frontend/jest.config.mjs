import nextJest from "next/jest.js";

const createNextJestConfig = nextJest({ dir: "./" })({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "scripts/**/*.mts",
    "!scripts/**/__tests__/**",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
});

export default async function jestConfig() {
  const nextConfig = await createNextJestConfig();
  const [[transformerPath, transformerOptions]] = Object.values(
    nextConfig.transform,
  );

  return {
    ...nextConfig,
    transform: {
      ...nextConfig.transform,
      "^.+\\.mts$": [
        "<rootDir>/jest.moduleTypescriptTransformer.cjs",
        { transformerPath, transformerOptions },
      ],
    },
  };
}
