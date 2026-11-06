// SPDX-License-Identifier: AGPL-3.0-only
const schema = 'grandet.website-status/v1';
const defaultSource = 'WEBSITE-STATUS.json';

export function statusUnavailable(source = defaultSource) {
  return [
    'Website status: unknown',
    'Desktop release status: unknown',
    'Skill release status: unknown',
    `Source: ${source} (unavailable or invalid)`,
  ];
}

export function statusLines(status, source = defaultSource) {
  const requiredStrings = [
    'url', 'status', 'desktopReleaseStatus', 'repositoryScope', 'skillVersion',
    'skillReleaseStatus', 'skillInstallation', 'catalogueRelease',
    'catalogueReleaseStatusPolicy',
  ];
  if (!status || typeof status !== 'object' || Array.isArray(status) ||
      status.schema !== schema ||
      requiredStrings.some(key => typeof status[key] !== 'string' || !status[key].trim()) ||
      typeof status.automaticDataUpdatesEnabled !== 'boolean' ||
      (status.checkedAt !== undefined &&
       (typeof status.checkedAt !== 'string' || Number.isNaN(Date.parse(status.checkedAt))))) {
    return statusUnavailable(source);
  }

  const lines = [
    `Website status: ${status.status}`,
    `Desktop release status: ${status.desktopReleaseStatus}`,
    `Skill release status: ${status.skillReleaseStatus}`,
  ];
  if (status.checkedAt) lines.push(`Checked at: ${status.checkedAt}`);
  lines.push(`Source: ${source}`);
  return lines;
}
