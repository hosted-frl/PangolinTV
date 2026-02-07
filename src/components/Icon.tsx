import React from 'react';
import {Text, View} from 'react-native';

import lockFill from '../../assets/icons/lock-fill.svg';

import unlockFill from '../../assets/icons/unlock-fill.svg';
import refresh from '../../assets/icons/refresh.svg';
import settings from '../../assets/icons/settings.svg';

const Components = {
  'lock-fill': lockFill,
  'unlock-fill': unlockFill,
  'refresh': refresh,
  'settings': settings,
};

export default function Icon(block: {
  name: keyof typeof Components;
  color?: string;
  style?: any;
  size?: number;
  _uid?: string;
  [k: string]: any;
}) {
  const Component = Components[block.name];

  if (typeof Component === 'undefined') {
    return <Text style={{color: '#000'}} key={block._uid}>?</Text>;
  }

  try {
    const { name, _uid, size, color, style, ...rest } = block as any;
    return (
      <View key={_uid} style={[{ justifyContent: 'center', alignItems: 'center' }, style]} {...rest}>
        <Component width={size} height={size} fill={color} />
      </View>
    );
  } catch (err) {
    console.error('Icon render error for', block.name, err);
    return <Text style={{color: '#000'}} key={block._uid}>?</Text>;
  }
}
