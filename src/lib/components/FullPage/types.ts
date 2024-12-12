export type FullPageConstructor = typeof import('fullpage.js');
export type FullPageInstance = InstanceType<FullPageConstructor>;
export type FullPageOptions = ConstructorParameters<FullPageConstructor>[1];
export type FullPageCallback = (fp: FullPageInstance) => void;
