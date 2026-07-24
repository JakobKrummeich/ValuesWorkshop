const semanticValueProps = [
  "/color$/",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "border-radius",
  "box-shadow",
  "gap",
  "row-gap",
  "column-gap",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
];

const config = {
  extends: ["stylelint-config-standard"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
    "selector-class-pattern": [
      "^[a-z][a-zA-Z0-9]*$",
      { message: "Class names must be camelCase" },
    ],
    "custom-property-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
      { message: "Custom properties must be kebab-case" },
    ],
    "custom-property-empty-line-before": null,
    "color-no-hex": true,
    "color-named": "never",
    "unit-disallowed-list": [
      ["px"],
      {
        ignoreMediaFeatureNames: { px: ["min-width", "max-width"] },
        message: "Use spacing/typography tokens instead of raw px",
      },
    ],
    "declaration-property-value-disallowed-list": [
      { "/.+/": ["/var\\(--base-/"] },
      { message: "Base primitives are reserved for token files" },
    ],
    "scale-unlimited/declaration-strict-value": [
      semanticValueProps,
      {
        ignoreValues: [
          "currentcolor",
          "inherit",
          "initial",
          "transparent",
          "none",
          "unset",
          "0",
        ],
        message: "Use design tokens (var(--…)) instead of raw values",
      },
    ],
  },
  overrides: [
    {
      files: ["**/tokens*.css"],
      rules: {
        "color-no-hex": null,
        "unit-disallowed-list": null,
        "declaration-property-value-disallowed-list": null,
        "scale-unlimited/declaration-strict-value": null,
      },
    },
  ],
};

export default config;
