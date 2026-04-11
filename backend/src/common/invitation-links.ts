export const normalizeBaseUrl = (value: string) =>
  value.trim().replace(/\/+$/, "");

export const buildInvitationLink = (
  baseUrl: string,
  acceptPath: string,
  token: string,
) => {
  const normalizedBaseUrl = normalizeBaseUrl(
    baseUrl || "http://localhost:3001",
  );
  const normalizedPath = acceptPath.startsWith("/")
    ? acceptPath
    : `/${acceptPath}`;

  const url = new URL(normalizedPath, normalizedBaseUrl);
  url.searchParams.set("token", token);
  return url.toString();
};
