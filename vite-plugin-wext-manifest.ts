import { Plugin, ResolvedConfig } from 'vite';
import path from 'node:path';
import {findUp} from 'find-up-simple';
import {readPackage} from 'read-pkg';
import {loadJsonFile} from 'load-json-file';

export const PLUGIN_NAME = 'vite-plugin-wext-manifest';

export const ENVKeys = {
    DEV: 'dev',
    PROD: 'prod',
} as const;

export const Browser = {
    CHROME: 'chrome',
    FIREFOX: 'firefox',
    EDGE: 'edge',
    BRAVE: 'brave',
    OPERA: 'opera',
    VIVALDI: 'vivaldi',
    ARC: 'arc',
    YANDEX: 'yandex',
} as const;

export type BrowserType = (typeof Browser)[keyof typeof Browser];

export const browserVendors: BrowserType[] = Object.values(Browser);
export const envVariables: string[] = [ENVKeys.DEV, ENVKeys.PROD];

// Refer: https://regex101.com/r/ddSEHh/1
export const CUSTOM_PREFIX_REGEX = new RegExp(
    `^__((?:(?:${[...browserVendors, ...envVariables].join('|')})\\|?)+)__(.*)`
);

export const transformManifest = (
    manifest: Record<string, string> | string | number | Awaited<ReturnType<typeof loadJsonFile>>,
    selectedVendor: BrowserType,
    nodeEnv: 'production' | 'development' | string
): any => {
    if (Array.isArray(manifest)) {
        return manifest.map((newManifest) => {
            return transformManifest(newManifest, selectedVendor, nodeEnv);
        });
    }

    if (typeof manifest === 'object') {
        return Object.entries(manifest).reduce(
            (newManifest: Record<string, string>, [key, value]) => {
                // match with vendors regex
                const vendorMatch: RegExpMatchArray | null =
                    key.match(CUSTOM_PREFIX_REGEX);

                if (vendorMatch) {
                    // match[1] => 'opera|firefox|dev' => ['opera', 'firefox', 'dev']
                    const matches: string[] = vendorMatch[1].split('|');
                    const isProd: boolean = nodeEnv === 'production';

                    const hasCurrentVendor = matches.includes(selectedVendor);
                    const hasVendorKeys = matches.some((m) =>
                        browserVendors.includes(m as never)
                    );
                    const hasEnvKey = matches.some((m) =>
                        envVariables.includes(m as never)
                    );

                    const hasCurrentEnvKey =
                        hasEnvKey &&
                        // if production env key is found
                        ((isProd && matches.includes(ENVKeys.PROD)) ||
                            // or if development env key is found
                            (!isProd && matches.includes(ENVKeys.DEV)));

                    // handles cases like
                    // 1. __dev__
                    // 2. __chrome__
                    // 3. __chrome|dev__

                    if (
                        // case: __chrome|dev__ (current vendor key and current env key)
                        (hasCurrentVendor && hasCurrentEnvKey) ||
                        // case: __dev__ (no vendor keys but current env key)
                        (!hasVendorKeys && hasCurrentEnvKey) ||
                        // case: __chrome__ (no env keys but current vendor key)
                        (!hasEnvKey && hasCurrentVendor)
                    ) {
                        // Swap key with non prefixed name
                        // match[2] => will be the key
                        newManifest[vendorMatch[2]] = transformManifest(
                            value,
                            selectedVendor,
                            nodeEnv
                        );
                    }
                } else {
                    newManifest[key] = transformManifest(value, selectedVendor, nodeEnv);
                }

                return newManifest;
            },
            {}
        );
    }

    return manifest;
};

interface WextManifestOptions {
    /**
     *  The path to the source manifest.json file, relative to the project root.
     */
    manifestPath: string;
    /**
     *  If true, updates manifest.json version field with package.json version. It is often useful for easy release of web-extension.
     */
    usePackageJSONVersion?: boolean;
}

export default function vitePluginWextManifest(options: WextManifestOptions): Plugin {
    let config: ResolvedConfig;

    if (!options?.manifestPath) {
        throw new Error(`${PLUGIN_NAME}: \`manifestPath\` option is required.`);
    }

    return {
        name: PLUGIN_NAME,
        configResolved(resolvedConfig) {
            config = resolvedConfig;
        },
        async buildStart() {
            const { mode, root } = config;
            const targetBrowser = process.env.TARGET_BROWSER;

            if (!targetBrowser) {
                this.error('`TARGET_BROWSER` environment variable is not set.');
            }

            if (!browserVendors.includes(targetBrowser)) {
                this.error(`Browser "${targetBrowser}" is not supported.`);
            }

            try {
                const sourceManifestPath = path.resolve(root, options.manifestPath);
                this.addWatchFile(sourceManifestPath);
                // Read and parse manifest.json file
                const manifestInput = await loadJsonFile(sourceManifestPath);
                // 1. Transform the manifest
                const transformed = transformManifest(manifestInput, targetBrowser, mode);

                // 2. Inject version from package.json if option is enabled
                const usePackageJSONVersion = !!options.usePackageJSONVersion;
                if (usePackageJSONVersion) {
                    try {
                        // find the closest package.json file
                        const packageJsonPath = await findUp('package.json');
                        if (!packageJsonPath) {
                            throw new Error("Couldn't find a closest package.json")
                        }

                        this.addWatchFile(packageJsonPath);
                        const packageJson = await readPackage({...options, cwd: path.dirname(packageJsonPath)})
                        if (!!transformed.version) {
                            transformed.version = packageJson.version.replace('-beta.', '.'); // eg: replaces `2.0.0-beta.1` to `2.0.0.1`
                        }
                    } catch (err) {
                        this.error(`Failed to process package.json: ${err.message}`);
                    }
                }

                // 3. Emit the final manifest file
                this.emitFile({
                    type: 'asset',
                    fileName: 'manifest.json',
                    source: JSON.stringify(transformed, null, 2),
                });
            } catch (err) {
                this.error(`Failed to process manifest.json: ${err.message}`);
            }
        },
    };
}