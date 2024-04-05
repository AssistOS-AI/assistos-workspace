module.exports = {
  JWT: {
    typ: "JWT",
    AccessTokens: {
      secret: "573b586be32639707c81138d1b869afec8bc0647a8f7a5de1fac6cccae07aa666864b19bb95fde4c96d9d4848fb38bc2ea70346cac57f453270a8ec5e0855411",
      algorithm: "HS256",
      expiresIn: {
        minutes: 5
      },
      issuer: "AssistOS",
      audience: "AssistOS"
    },
    RefreshTokens: {
      secret: "573b586be32639707c81138d1b869afec8bc0647a8f7a5de1fac6cccae07aa666864b19bb95fde4c96d9d4848fb38bc2ea70346cac57f453270a8ec5e0855411",
      algorithm: "HS256",
      expiresIn: {
        days: 30
      },
      issuer: "AssistOS",
      audience: "AssistOS"
    },
    EmailVerificationTokens: {
      secret: "573b586be32639707c81138d1b869afec8bc0647a8f7a5de1fac6cccae07aa666864b19bb95fde4c96d9d4848fb38bc2ea70346cac57f453270a8ec5e0855411",
      algorithm: "HS256",
      expiresIn: {
        hours: 1
      },
      issuer: "AssistOS",
      audience: "AssistOS"
    },
    AdminAccessTokens: {
      secret: "573b586be32639707c81138d1b869afec8bc0647a8f7a5de1fac6cccae07aa666864b19bb95fde4c96d9d4848fb38bc2ea70346cac57f453270a8ec5e0855411",
      algorithm: "HS256",
      expiresIn: {
        hours: 2
      },
      issuer: "AssistOS",
      audience: "AssistOS"
    }
  }
};
