import bcrypt from "bcryptjs";

export function validateAdminPassword(password) {
  if (typeof password !== "string" || password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD must contain 12-72 UTF-8 bytes (at least 12 characters).");
  }
}

export async function bootstrapAdmin({ account, adminUsernames, findUser, createUser, updateAuthentication, createPlayer, logWarning }) {
  const configuredPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
  if (configuredPassword) validateAdminPassword(configuredPassword);

  // Disable legacy test credentials without deleting the account or its progress.
  for (const username of adminUsernames) {
    const existing = await findUser(username);
    if (!existing || existing.authDisabled) continue;
    if (await bcrypt.compare("1234", existing.passwordHash)) {
      await updateAuthentication(existing._id, { authDisabled: true });
      logWarning(username);
    }
  }

  if (!configuredPassword) return;
  const existing = await findUser(account.username);
  if (!existing) {
    await createUser({
      username: account.username,
      email: account.email,
      passwordHash: await bcrypt.hash(configuredPassword, 12),
      playerData: createPlayer(),
    });
  } else if (existing.authDisabled) {
    await updateAuthentication(existing._id, {
      passwordHash: await bcrypt.hash(configuredPassword, 12),
      authDisabled: false,
    });
  }
}
