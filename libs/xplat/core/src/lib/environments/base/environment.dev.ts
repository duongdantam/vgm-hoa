import { IEnvironment } from '@fy/xplat/core';
import { deepMerge } from '@fy/xplat/utils';
import { environmentBase } from './environment.base';

export const environmentDev = deepMerge(environmentBase, <IEnvironment>{
  // customizations here...
});
