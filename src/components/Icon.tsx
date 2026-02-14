import React from 'react';
import {Text, View} from 'react-native';

import lockFill from '../../assets/icons/lock-fill.svg';

import unlockFill from '../../assets/icons/unlock-fill.svg';
import refresh from '../../assets/icons/refresh.svg';
import settings from '../../assets/icons/settings.svg';
import hourglass from '../../assets/icons/hourglass-line.svg';
import processing from '../../assets/icons/loader-2-line.svg';
import partially from '../../assets/icons/indeterminate-circle-line.svg';
import available from '../../assets/icons/checkbox-circle-line.svg';

const Components = {
  'lock-fill': lockFill,
  'unlock-fill': unlockFill,
  'refresh': refresh,
  'settings': settings,
  'pending': hourglass,
  'processing': processing,
  'partially': partially,
  'available': available,
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
