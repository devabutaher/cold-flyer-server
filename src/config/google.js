const { OAuth2Client } = require('google-auth-library');

const getClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return null;
  }
  return new OAuth2Client(clientId);
};

const verifyGoogleToken = async (idToken) => {
  const client = getClient();
  if (!client) {
    throw new Error('GOOGLE_CLIENT_ID not configured');
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Google token verification error:', error.message);
    throw new Error('Invalid Google token');
  }
};

module.exports = { verifyGoogleToken };
