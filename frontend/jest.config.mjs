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
  const tsEntry = Object.entries(nextConfig.transform).find(([pattern]) =>
    new RegExp(pattern).test(".tsx"),
  );
  if (!tsEntry) {
    throw new Error(
      "jest.config.mjs: no transform entry matching .tsx found in next/jest config",
    );
  }
  const [transformerPath, transformerOptions] = tsEntry[1];

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
