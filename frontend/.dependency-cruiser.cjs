/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "domain-must-not-import-adapters",
      severity: "error",
      comment: "domain/ is pure — it must not import from adapters/",
      from: { path: "^src/domain/" },
      to: { path: "^src/adapters/" },
    },
    {
      name: "domain-must-not-import-app",
      severity: "error",
      comment: "domain/ is pure — it must not import from app/",
      from: { path: "^src/domain/" },
      to: { path: "^src/app/" },
    },
    {
      name: "adapters-must-not-import-app",
      severity: "error",
      comment:
        "adapters/ implements ports from domain/ — it must not import from app/",
      from: { path: "^src/adapters/" },
      to: { path: "^src/app/" },
    },
    {
      name: "facilitator-must-not-import-participant",
      severity: "error",
      comment: "Screen groups must not import each other",
      from: { path: "^src/app/facilitator/" },
      to: { path: "^src/app/participant/" },
    },
    {
      name: "facilitator-must-not-import-presenter",
      severity: "error",
      comment: "Screen groups must not import each other",
      from: { path: "^src/app/facilitator/" },
      to: { path: "^src/app/presenter/" },
    },
    {
      name: "participant-must-not-import-facilitator",
      severity: "error",
      comment: "Screen groups must not import each other",
      from: { path: "^src/app/participant/" },
      to: { path: "^src/app/facilitator/" },
    },
    {
      name: "participant-must-not-import-presenter",
      severity: "error",
      comment: "Screen groups must not import each other",
      from: { path: "^src/app/participant/" },
      to: { path: "^src/app/presenter/" },
    },
    {
      name: "presenter-must-not-import-facilitator",
      severity: "error",
      comment: "Screen groups must not import each other",
      from: { path: "^src/app/presenter/" },
      to: { path: "^src/app/facilitator/" },
    },
    {
      name: "presenter-must-not-import-participant",
      severity: "error",
      comment: "Screen groups must not import each other",
      from: { path: "^src/app/presenter/" },
      to: { path: "^src/app/participant/" },
    },
    {
      name: "shared-must-not-import-adapters",
      severity: "error",
      comment: "shared/ is pure utilities — it must not import from adapters/",
      from: { path: "^src/shared/" },
      to: { path: "^src/adapters/" },
    },
    {
      name: "shared-must-not-import-app",
      severity: "error",
      comment: "shared/ is pure utilities — it must not import from app/",
      from: { path: "^src/shared/" },
      to: { path: "^src/app/" },
    },
    {
      name: "shared-must-not-import-domain",
      severity: "error",
      comment: "shared/ is pure utilities — it must not import from domain/",
      from: { path: "^src/shared/" },
      to: { path: "^src/domain/" },
    },
    {
      name: "no-circular",
      severity: "error",
      comment: "No circular dependencies anywhere",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};
