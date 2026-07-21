// Local OIDC provider for development only — never deployed.
// Clients and users are configured in Task 8; for now this serves the
// discovery document at /.well-known/openid-configuration.
import Provider from "oidc-provider";

const port = Number(process.env.OIDC_PORT ?? 9000);
const issuer = `http://localhost:${port}`;

const provider = new Provider(issuer, {});

provider.listen(port, () => {
  console.log(`oidc devtool: ${issuer}/.well-known/openid-configuration`);
});
