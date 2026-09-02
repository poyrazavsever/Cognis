const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const PODFILE_MARKER = '# Neta: CocoaPods UTF-8 path normalization';
const PODFILE_PATCH = `${PODFILE_MARKER}
# CocoaPods may return command output as ASCII-8BIT when the repository path
# contains non-ASCII characters. Normalize it before podspecs concatenate paths.
class Pod::Executable::Indenter
  def join(separator = nil)
    super(separator).force_encoding(Encoding::UTF_8)
  end
end

`;

const DEV_LAUNCHER_PHASE = '[Expo Dev Launcher] Strip Local Network Keys for Release';

function withPodfileUtf8PathFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const podfilePath = path.join(modConfig.modRequest.platformProjectRoot, 'Podfile');
      const podfile = await fs.promises.readFile(podfilePath, 'utf8');

      if (!podfile.includes(PODFILE_MARKER)) {
        await fs.promises.writeFile(podfilePath, `${PODFILE_PATCH}${podfile}`, 'utf8');
      }

      return modConfig;
    },
  ]);
}

function withDevLauncherBuildPhaseFix(config) {
  return withXcodeProject(config, (modConfig) => {
    const phases =
      modConfig.modResults.hash.project.objects.PBXShellScriptBuildPhase ?? {};

    for (const phase of Object.values(phases)) {
      if (typeof phase !== 'object' || !phase) {
        continue;
      }

      const name = String(phase.name ?? '').replaceAll('"', '');
      if (name === DEV_LAUNCHER_PHASE) {
        phase.alwaysOutOfDate = '1';
      }
    }

    return modConfig;
  });
}

module.exports = (config) =>
  withDevLauncherBuildPhaseFix(withPodfileUtf8PathFix(config));
