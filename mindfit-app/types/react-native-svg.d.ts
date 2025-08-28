// Minimal ambient declaration to satisfy TypeScript when @types/react-native-svg isn't present
declare module 'react-native-svg' {
  import * as React from 'react';
  export const Svg: React.ComponentType<any>;
  export const Polyline: React.ComponentType<any>;
  export const Line: React.ComponentType<any>;
  export const Circle: React.ComponentType<any>;
  const _default: any;
  export default _default;
}
