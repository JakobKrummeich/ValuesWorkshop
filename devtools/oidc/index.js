import Provider from "oidc-provider";

const port = Number(process.env.OIDC_PORT ?? 9000);
const issuer = `http://localhost:${port}`;

const provider = new Provider(issuer, {});

provider.listen(port, () => {
  console.log(`oidc devtool: ${issuer}/.well-known/openid-configuration`);
});
