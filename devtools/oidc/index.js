import { readFileSync } from "node:fs";
import Provider from "oidc-provider";

const port = Number(process.env.OIDC_PORT ?? 9000);
const issuer = process.env.OIDC_ISSUER ?? `http://localhost:${port}`;
const apiResource = process.env.OIDC_API_RESOURCE ?? "http://localhost:5000";

const accounts = JSON.parse(
  readFileSync(new URL("./accounts.json", import.meta.url), "utf8"),
);

const testAccounts = { facilitator: { name: accounts.facilitatorName } };
for (const [index, name] of accounts.participantNames.entries()) {
  testAccounts[`participant${index + 1}`] = { name };
}

const provider = new Provider(issuer, {
  clients: [
    {
      client_id: "valuesworkshop",
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      redirect_uris: [
        "http://localhost:3000/auth/callback",
        "http://localhost:3000/facilitator",
        "http://localhost:3000/participant",
      ],
      post_logout_redirect_uris: ["http://localhost:3000"],
    },
  ],

  scopes: ["openid", "profile", "offline_access"],

  features: {
    devInteractions: { enabled: true },
    revocation: { enabled: true },
    resourceIndicators: {
      enabled: true,
      defaultResource: () => apiResource,
      useGrantedResource: () => true,
      getResourceServerInfo: () => ({
        audience: apiResource,
        scope: "openid profile",
        accessTokenFormat: "jwt",
      }),
    },
  },

  ttl: {
    AccessToken: 600,
    RefreshToken: 10800,
    IdToken: 3600,
  },

  async extraTokenClaims(_context, token) {
    const account = testAccounts[token.accountId];

    return account ? { name: account.name } : undefined;
  },

  async findAccount(_context, id) {
    const account = testAccounts[id];
    if (!account) {
      return undefined;
    }
    return {
      accountId: id,
      async claims(_use, _scope) {
        return {
          sub: id,
          name: account.name,
        };
      },
    };
  },

  pkce: {
    methods: ["S256"],
    required: () => true,
  },

  cookies: {
    keys: ["dev-cookie-secret-not-for-production"],
  },
});

provider.listen(port, () => {
  console.log(`oidc devtool: ${issuer}/.well-known/openid-configuration`);
  console.log(`test accounts: ${Object.keys(testAccounts).join(", ")}`);
});
