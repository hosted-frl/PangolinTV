import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { onAlert, AlertPayload } from '../utils/alertBus';
import theme from '../theme';

export default function CustomAlert() {
  const [visible, setVisible] = useState(false);
  const [payload, setPayload] = useState<AlertPayload | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAlert((p) => {
      setPayload(p);
      setVisible(true);
    });
    return unsub;
  }, []);
  if (!payload) return null;

  const handleClose = (cb?: () => void) => {
    setVisible(false);
    setTimeout(() => {
      cb && cb();
      setPayload(null);
    }, 120);
  };

  const buttons = payload.buttons && payload.buttons.length > 0 ? payload.buttons : [{ text: 'OK' }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      hardwareAccelerated
      onRequestClose={() => handleClose()}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{payload.title}</Text>
          {payload.message ? <Text style={styles.message}>{payload.message}</Text> : null}
          <View style={styles.actions}>
            {buttons.map((b, i) => (
              <Pressable
                key={i}
                focusable={true}
                hasTVPreferredFocus={i === 0}
                onFocus={() => setFocusedIndex(i)}
                onBlur={() => setFocusedIndex((idx) => (idx === i ? null : idx))}
                style={({ pressed }) => [
                  styles.btn,
                  focusedIndex === i && styles.btnFocused,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => handleClose(b.onPress)}
              >
                <Text style={[styles.btnText, focusedIndex === i && styles.btnTextFocused]}>{b.text}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: theme.primaryScale[20] || '#111',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#fff',
  },
  message: {
    fontSize: 14,
    marginBottom: 12,
    color: '#eee',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    // backgroundColor: theme.primaryScale[60] || '#1e88e5',
  },
  btnFocused: {
    borderWidth: 2,
    borderColor: theme.primaryScale[50] || '#1e88e5',
  },
  btnPressed: {
    opacity: 0.85,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
