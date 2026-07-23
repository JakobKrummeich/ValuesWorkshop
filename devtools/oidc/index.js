import Provider from "oidc-provider";

const port = Number(process.env.OIDC_PORT ?? 9000);
const issuer = process.env.OIDC_ISSUER ?? `http://localhost:${port}`;

const testAccounts = {
  facilitator: { name: "Workshop Facilitator" },
  participant1: { name: "Alice" },
  participant2: { name: "Bob" },
  participant3: { name: "Charlie" },
  participant4: { name: "Diana" },
  participant5: { name: "Eve" },
};

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
  },

  formats: {
    AccessToken: "jwt",
  },

  ttl: {
    AccessToken: 600,
    RefreshToken: 10800,
    IdToken: 3600,
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
